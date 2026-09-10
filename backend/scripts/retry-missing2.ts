import fs from 'node:fs';
import path from 'node:path';
import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

const ROOT = 'C:\\Users\\정주희\\orca\\workspaces\\Amway\\https-github.com-settlegate-Amway.git';
const ALL = path.join(ROOT, 'backend', 'scripts', 'all-product-urls.txt');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function skuFromUrl(u: string): string | null {
  try {
    const url = new URL(u);
    const parts = url.pathname.split('/').filter(Boolean);
    const pIdx = parts.lastIndexOf('p');
    return pIdx >= 0 && parts[pIdx + 1] ? parts[pIdx + 1] : null;
  } catch {
    return null;
  }
}

async function main() {
  const lines = fs.readFileSync(ALL, 'utf8').split(/\r?\n/).filter(Boolean);
  const db = await prisma.product.findMany({ where: { isActive: true }, select: { aClicUrl: true } });
  const dbSkus = new Set(db.map((p) => skuFromUrl(p.aClicUrl || '')).filter(Boolean));

  const missing = lines
    .map((l) => {
      const i = l.lastIndexOf('|');
      return { url: l.slice(0, i).trim(), category: l.slice(i + 1).trim() };
    })
    .filter((m) => !dbSkus.has(skuFromUrl(m.url)));

  console.log(`[retry] 아직 DB에 없는 사이트 상품 ${missing.length}개`);

  let ok = 0;
  let fail = 0;
  for (const m of missing) {
    try {
      const r = await syncProductFromUrl(m.url, { category: m.category });
      if (r.name === 'amway.co.kr' || r.price === 0) {
        await prisma.product.delete({ where: { id: r.id } });
        fail++;
        console.warn(`[retry] 파싱 실패로 삭제: ${m.url}`);
      } else {
        ok++;
        console.log(`[retry] OK ${r.name} (${r.price}원) - ${m.category}`);
      }
    } catch (e: any) {
      fail++;
      console.warn(`[retry] FAIL ${m.url}: ${e?.message || e}`);
    }
    await sleep(3000);
  }

  const total = await prisma.product.count({ where: { isActive: true } });
  console.log(`[retry] 완료: 성공 ${ok}, 실패 ${fail}, 최종 활성 상품 ${total}개`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
