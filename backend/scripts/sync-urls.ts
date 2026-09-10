import fs from 'node:fs';
import path from 'node:path';
import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

const LIST_PATH = process.argv[2] || path.join(__dirname, 'product-urls.txt');
const DELAY_MS = Number(process.env.SYNC_DELAY_MS || 2000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function categoryFromUrl(url: string): string | undefined {
  if (url.includes('/proteins')) return '단백질';
  if (url.includes('/probiotic-fibers')) return '유산균';
  if (url.includes('/mylab-microbiome')) return '유산균';
  if (url.includes('/vitamins-minerals')) return '비타민/미네랄';
  if (url.includes('/bodykey')) return '체중/체성분';
  if (url.includes('/functional')) return '기능성';
  if (url.includes('/n-by-nutrilite')) return '기능성';
  if (url.includes('/food-beverage')) return '식품/음료';
  if (url.includes('/xs-energy')) return '음료';
  if (url.includes('/nutrikids')) return '어린이';
  if (url.includes('/nutrition-gift-set')) return '선물세트';
  if (url.includes('/nutrition-sales-aid')) return '보조용품';
  return undefined;
}

async function main() {
  if (!fs.existsSync(LIST_PATH)) {
    console.error(`[sync-urls] 목록 파일이 없습니다: ${LIST_PATH}`);
    process.exit(1);
  }

  const urls = fs
    .readFileSync(LIST_PATH, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  console.log(`[sync-urls] ${urls.length}개 URL 동기화 시작 (간격 ${DELAY_MS}ms)`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      const r = await syncProductFromUrl(url, {
        category: categoryFromUrl(url),
      });
      ok += 1;
      console.log(
        `[sync-urls] ${r.isNew ? '신규' : '갱신'} ${r.name} ` +
          `(${r.price}원, PV ${r.pv ?? '-'}, BV ${r.bv ?? '-'})`
      );
    } catch (err: any) {
      failed += 1;
      console.warn(`[sync-urls] 실패 ${url}: ${err?.message || err}`);
    }
    await sleep(DELAY_MS);
  }

  const total = await prisma.product.count({ where: { isActive: true } });
  console.log(`[sync-urls] 완료: 성공 ${ok}, 실패 ${failed}, 활성 상품 총 ${total}개`);
}

main()
  .catch((err) => {
    console.error('[sync-urls] 오류:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
