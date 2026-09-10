const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\정주희\\orca\\workspaces\\Amway\\https-github.com-settlegate-Amway.git';
const ALL_PRODUCTS_URL = 'https://api.amway.co.kr/shop/c/shop';
const PRODUCTS_API = 'http://localhost:3001/api/admin/products';
const OUTPUT_JSON = path.join(ROOT, 'category-comparison.json');
const OUTPUT_MD = path.join(ROOT, 'category-comparison.md');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function jinaFetch(targetUrl, retries = 2) {
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
          console.warn(`  Jina rate/CAPTCHA, backing off 10s`);
          await sleep(10000);
          continue;
        }
        return text;
      }
      console.warn(`  HTTP ${res.status} for ${targetUrl}`);
      if (res.status === 429 || res.status === 403 || res.status === 503) {
        await sleep(8000 + rand(0, 4000));
        continue;
      }
    } catch (e) {
      console.warn(`  fetch error: ${e.message}`);
    }
    if (i < retries) await sleep(5000 + rand(0, 3000));
  }
  return '';
}

async function parseNav() {
  console.log('Fetching nav...');
  const text = await jinaFetch('https://api.amway.co.kr/c/shop', 2);
  const regex =
    /\[([^\]]+)\]\((https:\/\/api\.amway\.co\.kr\/shop\/[^\)\s]+)(?:\s+"[^"]*")?\s*\)/g;
  const list = [];
  const seen = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) {
    let name = m[1].replace(/^!\[[^\]]*\]\([^)]*\)\s*/, '').trim();
    let url = m[2].trim();
    if (!url.includes('/c/')) continue;
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const cIdx = parts.lastIndexOf('c');
      if (cIdx < 2) continue;
      const code = parts[cIdx + 1];
      const catPath = '/' + parts.slice(0, cIdx).join('/');
      if (seen.has(url)) continue;
      seen.add(url);
      list.push({ name, url, code, path: catPath, source: 'nav' });
    } catch {}
  }
  const isParent = (cat) =>
    list.some((other) => other !== cat && other.path.startsWith(cat.path + '/'));
  const leaves = list.filter((c) => !isParent(c));
  console.log(`  nav categories: ${list.length}, leaves: ${leaves.length}`);
  return leaves;
}

function extractProducts(text) {
  const regex =
    /(?:https?:\/\/(?:www\.|api\.)?amway\.co\.kr)?(\/shop\/[^\s"'\)\]]*\/p\/)([A-Za-z0-9]+)/g;
  const out = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    let full = m[0];
    if (full.startsWith('/')) full = 'https://api.amway.co.kr' + full;
    out.push({ sku: m[2], url: full });
  }
  return out;
}

async function collectAllProducts() {
  console.log('Collecting all products from c/shop grid...');
  const global = new Map(); // sku -> { url, code, path }

  // High page numbers sometimes return the full product grid in one response.
  // Try a few safe high values before falling back to sequential pagination.
  const highPages = [63, 65, 70, 100];
  for (const hp of highPages) {
    const text = await jinaFetch(`${ALL_PRODUCTS_URL}?page=${hp}`, 2);
    if (!text) continue;
    const items = extractProducts(text);
    for (const it of items) {
      if (global.has(it.sku)) continue;
      try {
        const u = new URL(it.url);
        const parts = u.pathname.split('/').filter(Boolean);
        const pIdx = parts.lastIndexOf('p');
        const catPath = '/' + parts.slice(0, pIdx).join('/');
        const code = parts[pIdx - 1];
        global.set(it.sku, { ...it, path: catPath, code });
      } catch {}
    }
    console.log(`[c/shop] high page=${hp}: links=${items.length}, total=${global.size}`);
    if (global.size > 400) {
      console.log(`  using high page ${hp}, total unique products: ${global.size}`);
      return global;
    }
    await sleep(rand(1500, 2500));
  }

  // Fallback: normal pagination
  for (let page = 0; page < 80; page++) {
    const url = page === 0 ? ALL_PRODUCTS_URL : `${ALL_PRODUCTS_URL}?page=${page}`;
    const text = await jinaFetch(url, 2);
    if (!text) {
      console.warn(`[c/shop] page ${page}: empty, stop`);
      break;
    }
    const items = extractProducts(text);
    let added = 0;
    for (const it of items) {
      if (global.has(it.sku)) continue;
      try {
        const u = new URL(it.url);
        const parts = u.pathname.split('/').filter(Boolean);
        const pIdx = parts.lastIndexOf('p');
        const catPath = '/' + parts.slice(0, pIdx).join('/');
        const code = parts[pIdx - 1];
        global.set(it.sku, { ...it, path: catPath, code });
        added++;
      } catch {}
    }
    console.log(`[c/shop] page=${page}: links=${items.length}, new=${added}, total=${global.size}`);
    if (added === 0 && page > 0) break;
    await sleep(rand(1500, 2500));
  }
  console.log(`  total unique products from grid: ${global.size}`);
  return global;
}

async function collectCategoryPage(cat) {
  console.log(`  collecting hidden category: ${cat.name}`);
  const seen = new Set();
  for (let page = 0; page < 20; page++) {
    const url = page === 0 ? cat.url : `${cat.url}?page=${page}`;
    const text = await jinaFetch(url, 2);
    if (!text) break;
    const items = extractProducts(text);
    let added = 0;
    for (const it of items) {
      try {
        const u = new URL(it.url);
        const parts = u.pathname.split('/').filter(Boolean);
        const pIdx = parts.lastIndexOf('p');
        const prefix = '/' + parts.slice(0, pIdx).join('/');
        if (prefix === cat.path && !seen.has(it.sku)) {
          seen.add(it.sku);
          added++;
        }
      } catch {}
    }
    if (added === 0 && page > 0) break;
    await sleep(rand(1500, 2500));
  }
  return seen.size;
}

async function getDbProducts() {
  const res = await fetch(PRODUCTS_API, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`DB API error: ${res.status}`);
  const data = await res.json();
  return data.filter((p) => p.isActive);
}

function dbSkuFromUrl(aClicUrl) {
  if (!aClicUrl) return null;
  try {
    const u = new URL(aClicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const pIdx = parts.lastIndexOf('p');
    return pIdx > 0 ? parts[pIdx - 1] : parts[parts.length - 1];
  } catch {
    return null;
  }
}

function dbCategoryPath(aClicUrl) {
  if (!aClicUrl) return null;
  try {
    const u = new URL(aClicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const pIdx = parts.lastIndexOf('p');
    return pIdx > 0 ? '/' + parts.slice(0, pIdx).join('/') : null;
  } catch {
    return null;
  }
}

function mapByCategoryField(category, byCode) {
  const mapping = {
    '비타민/미네랄': 'vitamins-minerals',
    '단백질': 'proteins',
    '유산균': 'probiotic-fibers',
    '유산균/식이섬유': 'probiotic-fibers',
    '기능성': 'functional',
    '식물영양소': 'functional',
    '뼈/관절': 'vitamins-minerals',
    '어린이': 'nutrikids',
    '식품/음료': 'food-beverage',
    '음료': 'food-beverage',
    '체중/체성분': 'bodykey',
    '홈리빙/정수기': 'espring',
    '홈리빙/공기청정': 'atmosphere-sky',
    '홈리빙/주방': 'amway-queen',
    '홈리빙/세제': 'laundry-care',
    '홈리빙': 'laundry-care',
    '퍼스널케어/구강케어': 'toothpastes',
    '퍼스널케어/헤어': 'shampoos',
    '퍼스널케어/바디': 'body-wash',
    '퍼스널케어': 'shampoos',
    '뷰티/디바이스': 'beauty-device',
    '뷰티/클렌징': 'cleansing-foam-gel',
    '뷰티/메이크업': 'base-makeup',
    '뷰티/스킨케어': 'skin-care-toner-mist',
    '뷰티': 'skin-care-toner-mist',
    '선물세트': 'nutrition-gift-set',
    '보조용품': 'nutrition-sales-aid',
  };
  const code = mapping[category];
  if (code && byCode.has(code)) return byCode.get(code);
  return null;
}

async function main() {
  const navCats = await parseNav();
  const products = await collectAllProducts();

  // Group by category path
  const byPath = new Map();
  for (const [sku, it] of products) {
    if (!byPath.has(it.path)) {
      byPath.set(it.path, { code: it.code, skus: new Set() });
    }
    byPath.get(it.path).skus.add(sku);
  }

  // Build category list
  const categories = [];
  const byCode = new Map();

  for (const c of navCats) {
    const group = byPath.get(c.path);
    const siteCount = group ? group.skus.size : 0;
    const row = { ...c, siteCount, dbCount: 0 };
    categories.push(row);
    byCode.set(c.code, row);
  }

  // Hidden categories from c/shop grid
  const navPaths = new Set(navCats.map((c) => c.path));
  for (const [catPath, info] of byPath) {
    if (!navPaths.has(catPath)) {
      const row = {
        name: `기타(${info.code})`,
        url: `https://api.amway.co.kr${catPath}/c/${info.code}`,
        code: info.code,
        path: catPath,
        source: 'cshop',
        siteCount: info.skus.size,
        dbCount: 0,
      };
      categories.push(row);
      byCode.set(info.code, row);
    }
  }

  const dbProducts = await getDbProducts();
  console.log(`DB active products: ${dbProducts.length}`);

  // Map DB products
  const unmapped = [];
  for (const p of dbProducts) {
    const code = dbSkuFromUrl(p.aClicUrl);
    if (!code) {
      unmapped.push(p);
      continue;
    }
    const cat = byCode.get(code);
    if (cat) {
      cat.dbCount++;
    } else {
      const fallback = mapByCategoryField(p.category, byCode);
      if (fallback) {
        fallback.dbCount++;
      } else {
        unmapped.push(p);
      }
    }
  }

  // Try to collect hidden category pages for unmapped DB products
  const hiddenFromDb = new Map();
  for (const p of unmapped) {
    const catPath = dbCategoryPath(p.aClicUrl);
    const code = dbSkuFromUrl(p.aClicUrl);
    if (!catPath || !code || hiddenFromDb.has(code)) continue;
    hiddenFromDb.set(code, {
      name: `기타(${code})`,
      url: `https://api.amway.co.kr${catPath}/c/${code}`,
      code,
      path: catPath,
      source: 'db-hidden',
      siteCount: 0,
      dbCount: 0,
    });
  }
  for (const cat of hiddenFromDb.values()) {
    cat.siteCount = await collectCategoryPage(cat);
    categories.push(cat);
    byCode.set(cat.code, cat);
  }

  // Re-map unmapped after hidden discovery
  const stillUnmapped = [];
  for (const p of unmapped) {
    const code = dbSkuFromUrl(p.aClicUrl);
    const cat = code ? byCode.get(code) : null;
    if (cat) {
      cat.dbCount++;
    } else {
      const fallback = mapByCategoryField(p.category, byCode);
      if (fallback) fallback.dbCount++;
      else stillUnmapped.push(p);
    }
  }

  // 기타/미분류 row
  const etcRow = {
    name: '기타/미분류',
    url: '',
    code: 'etc',
    path: '',
    source: 'fallback',
    siteCount: 0,
    dbCount: stillUnmapped.length,
  };
  categories.push(etcRow);

  for (const c of categories) c.diff = c.siteCount - c.dbCount;

  const siteTotal = products.size;
  const dbTotal = dbProducts.length;

  const outJson = {
    collectedAt: new Date().toISOString(),
    siteTotal,
    dbTotal,
    categories: categories.map((c) => ({
      name: c.name,
      siteUrl: c.url,
      siteCount: c.siteCount,
      dbCount: c.dbCount,
      diff: c.diff,
    })),
  };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(outJson, null, 2), 'utf8');

  // Markdown
  const main = categories.filter((c) => c.source === 'nav');
  main.sort((a, b) => b.siteCount - a.siteCount);
  const topCount = 20;
  const top = main.slice(0, topCount);

  let md = '# Amway Korea 카테고리별 상품 수 비교\n\n';
  md += `수집 시각: ${outJson.collectedAt}\n\n`;
  md += `- **사이트 전체 상품 수(전체제품 그리드 기준 고유 SKU)**: ${siteTotal}건\n`;
  md += `- **DB 활성 상품 수**: ${dbTotal}건\n`;
  md += `- **총 차이(사이트 - DB)**: ${siteTotal - dbTotal}건\n\n`;
  md += `> Amway 쇼핑 전체제품 페이지 상단에는 "569건의 제품"으로 표기되어 있습니다. `;
  md += `실제 전체제품 그리드에서 수집된 고유 SKU는 ${siteTotal}건이며, `;
  md += `SOP/설치 상품, 품절/출시예정, 레거시/히든 카테고리 등으로 인해 569건과 차이가 발생할 수 있습니다.\n\n`;
  md += '| 카테고리 | 사이트 | DB | 차이 | 비고 |\n';
  md += '|---|---:|---:|---:|:---|\n';
  for (const c of top) {
    const note =
      c.diff > 0
        ? '사이트 상품이 더 많음'
        : c.diff < 0
        ? 'DB에만 있는 상품 있음'
        : '일치';
    md += `| ${c.name} | ${c.siteCount} | ${c.dbCount} | ${c.diff} | ${note} |\n`;
  }
  const topSite = top.reduce((s, c) => s + c.siteCount, 0);
  const topDb = top.reduce((s, c) => s + c.dbCount, 0);
  const etcSite = siteTotal - topSite;
  const etcDb = dbTotal - topDb;
  const etcDiff = etcSite - etcDb;
  md += `| 기타/미분류 | ${etcSite} | ${etcDb} | ${etcDiff} | 미표시 카테고리 및 DB에만 있는 상품 집계 |\n`;
  md += `| **합계** | **${siteTotal}** | **${dbTotal}** | **${siteTotal - dbTotal}** | 전체 |\n`;
  fs.writeFileSync(OUTPUT_MD, md, 'utf8');

  console.log('Done');
  console.log(`siteTotal=${siteTotal}, dbTotal=${dbTotal}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
