import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  const products = await prisma.product.findMany({
    where: { aClicUrl: { not: null } },
  });

  console.log(`[resync] 총 ${products.length}개 상품의 구매 가능 여부를 갱신합니다.`);
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const r = await syncProductFromUrl(p.aClicUrl!, { code: p.code });
      ok++;
      const status = r.isPurchasable === false ? '구매불가' : '구매가능';
      console.log(`[resync] ${i + 1}/${products.length} ${status} ${r.name}`);
    } catch (err: any) {
      failed++;
      console.warn(`[resync] ${i + 1}/${products.length} FAIL ${p.name}: ${err?.message || err}`);
    }
    if (i < products.length - 1) {
      await sleep(rand(1200, 2200));
    }
  }

  const notPurchasable = await prisma.product.count({
    where: { isActive: true, isPurchasable: false },
  });
  const total = await prisma.product.count({ where: { isActive: true } });
  console.log(`[resync] 완료: 성공 ${ok}, 실패 ${failed}, 구매불가 ${notPurchasable}/${total}`);
}

main()
  .catch((err) => {
    console.error('[resync] 오류:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
