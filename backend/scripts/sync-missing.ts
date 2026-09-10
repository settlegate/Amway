import fs from 'node:fs';
import path from 'node:path';
import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

const ROOT = 'C:\\Users\\정주희\\orca\\workspaces\\Amway\\https-github.com-settlegate-Amway.git';
const ALL_PRODUCTS_URL = 'https://api.amway.co.kr/shop/c/shop';
const PRODUCTS_API = ''; // not used
const OUT_ALL = path.join(ROOT, 'backend', 'scripts', 'all-product-urls.txt');
const OUT_MISSING = path.join(ROOT, 'backend', 'scripts', 'missing-product-urls.txt');
const OUT_LOG = path.join(ROOT, 'backend', 'scripts', 'sync-missing.log');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function jinaFetch(targetUrl: string, retries = 2): Promise<string> {
  const jina = `https://r.jina.ai/${targetUrl}`;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(jina, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const text = await res.text();
        if (
          text.toLowerCase().includes('captcha') ||
          text.includes('Too Many Requests') ||
          /rate\s*limit/i.test(text) ||
          /429/i.test(text.slice(0, 200))
        ) {
          console.warn('  Jina rate/CAPTCHA, backing off 15s');
          await sleep(15000);
          continue;
        }
        return text;
      }
      console.warn(`  HTTP ${res.status} for ${targetUrl}`);
      if (res.status === 429 || res.status === 403 || res.status === 503) {
        await sleep(10000 + rand(0, 5000));
        continue;
      }
    } catch (e: any) {
      console.warn(`  fetch error: ${e.message}`);
    }
    if (i < retries) await sleep(6000 + rand(0, 3000));
  }
  return '';
}

async function parseNav(): Promise<{ name: string; code: string }[]> {
  console.log('[sync-missing] nav 파싱 중...');
  const text = await jinaFetch('https://api.amway.co.kr/c/shop', 2);
  const regex =
    /\[([^\]]+)\]\((https:\/\/api\.amway\.co\.kr\/shop\/[^\)\s]+)(?:\s+"[^"]*")?\s*\)/g;
  const list: { name: string; code: string }[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1].replace(/^!\[[^\]]*\]\([^)]*\)\s*/, '').trim();
    const url = m[2].trim();
    if (!url.includes('/c/')) continue;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const cIdx = parts.lastIndexOf('c');
      if (cIdx < 2) continue;
      const code = parts[cIdx + 1];
      if (seen.has(code)) continue;
      seen.add(code);
      list.push({ name, code });
    } catch {}
  }
  console.log(`[sync-missing] nav 카테고리 ${list.length}개 파싱 완료`);
  return list;
}

function extractProducts(text: string): { sku: string; url: string; code: string; path: string }[] {
  const regex =
    /(?:https?:\/\/(?:www\.|api\.)?amway\.co\.kr)?(\/shop\/[^\s"'\)\]]*\/p\/)([A-Za-z0-9]+)/g;
  const out: { sku: string; url: string; code: string; path: string }[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    try {
      const u = new URL(m[0].startsWith('/') ? 'https://api.amway.co.kr' + m[0] : m[0]);
      const parts = u.pathname.split('/').filter(Boolean);
      const pIdx = parts.lastIndexOf('p');
      const catPath = '/' + parts.slice(0, pIdx).join('/');
      const code = parts[pIdx - 1];
      const url = `https://www.amway.co.kr${m[1]}${m[2]}`;
      out.push({ sku: m[2], url, code, path: catPath });
    } catch {}
  }
  return out;
}

async function collectAllProducts(): Promise<Map<string, { sku: string; url: string; code: string; path: string }>> {
  console.log('[sync-missing] 전체제품 그리드 수집 중...');
  const global = new Map<string, { sku: string; url: string; code: string; path: string }>();

  const highPages = [63, 65, 70, 100];
  for (const hp of highPages) {
    const text = await jinaFetch(`${ALL_PRODUCTS_URL}?page=${hp}`, 2);
    if (!text) continue;
    const items = extractProducts(text);
    for (const it of items) {
      if (!global.has(it.sku)) global.set(it.sku, it);
    }
    console.log(`[sync-missing] high page=${hp}: links=${items.length}, total=${global.size}`);
    if (global.size > 400) break;
    await sleep(rand(1500, 2500));
  }

  if (global.size <= 400) {
    for (let page = 0; page < 80; page++) {
      const url = page === 0 ? ALL_PRODUCTS_URL : `${ALL_PRODUCTS_URL}?page=${page}`;
      const text = await jinaFetch(url, 2);
      if (!text) {
        console.warn(`[sync-missing] page ${page}: empty, stop`);
        break;
      }
      const items = extractProducts(text);
      let added = 0;
      for (const it of items) {
        if (!global.has(it.sku)) {
          global.set(it.sku, it);
          added++;
        }
      }
      console.log(`[sync-missing] page=${page}: links=${items.length}, new=${added}, total=${global.size}`);
      if (added === 0 && page > 0) break;
      await sleep(rand(1500, 2500));
    }
  }

  console.log(`[sync-missing] 전체 수집 완료: ${global.size}개 고유 SKU`);
  return global;
}

async function getDbProducts(): Promise<any[]> {
  return prisma.product.findMany({ where: { isActive: true } });
}

function skuFromUrl(aClicUrl: string | null): string | null {
  if (!aClicUrl) return null;
  try {
    const u = new URL(aClicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const pIdx = parts.lastIndexOf('p');
    return pIdx > 0 ? parts[pIdx + 1] || parts[pIdx - 1] : parts[parts.length - 1];
  } catch {
    return null;
  }
}

function logToFile(line: string) {
  fs.appendFileSync(OUT_LOG, line + '\n', 'utf8');
}

async function main() {
  const nav = await parseNav();
  const codeToName = new Map(nav.map((c) => [c.code, c.name]));

  const allProducts = await collectAllProducts();
  const allLines: string[] = [];
  for (const it of allProducts.values()) {
    const cat = codeToName.get(it.code) || it.code;
    allLines.push(`${it.url}|${cat}`);
  }
  fs.writeFileSync(OUT_ALL, allLines.join('\n'), 'utf8');
  console.log(`[sync-missing] ${OUT_ALL} 저장 완료: ${allLines.length}개`);

  const dbProducts = await getDbProducts();
  const dbSkus = new Set<string>();
  for (const p of dbProducts) {
    const sku = skuFromUrl(p.aClicUrl);
    if (sku) dbSkus.add(sku);
  }

  const missing: { url: string; category: string }[] = [];
  for (const it of allProducts.values()) {
    if (!dbSkus.has(it.sku)) {
      const category = codeToName.get(it.code) || it.code;
      missing.push({ url: it.url, category });
    }
  }

  fs.writeFileSync(
    OUT_MISSING,
    missing.map((m) => `${m.url}|${m.category}`).join('\n'),
    'utf8'
  );
  console.log(
    `[sync-missing] ${OUT_MISSING} 저장 완료: ${missing.length}개 (DB ${dbProducts.length}개 중 ${allProducts.size - missing.size}개 중복)`
  );

  if (missing.length === 0) {
    console.log('[sync-missing] 추가 싱크가 필요한 상품이 없습니다.');
    return;
  }

  fs.writeFileSync(OUT_LOG, `[sync-missing] started at ${new Date().toISOString()}\n`, 'utf8');
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const { url, category } = missing[i];
    try {
      const r = await syncProductFromUrl(url, { category });
      ok++;
      const line = `[${i + 1}/${missing.length}] OK ${r.name} (${r.price}원) - ${category}`;
      console.log(line);
      logToFile(line);
    } catch (err: any) {
      failed++;
      const line = `[${i + 1}/${missing.length}] FAIL ${url}: ${err?.message || err}`;
      console.warn(line);
      logToFile(line);
    }
    if (i < missing.length - 1) {
      await sleep(rand(1800, 2500));
    }
  }

  const total = await prisma.product.count({ where: { isActive: true } });
  const finalLine = `[sync-missing] 완료: 성공 ${ok}, 실패 ${failed}, DB 활성 상품 총 ${total}개`;
  console.log(finalLine);
  logToFile(finalLine);
}

main()
  .catch((err) => {
    console.error('[sync-missing] 오류:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
