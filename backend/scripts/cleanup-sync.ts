import fs from 'node:fs';
import path from 'node:path';
import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

const ROOT = 'C:\\Users\\정주희\\orca\\workspaces\\Amway\\https-github.com-settlegate-Amway.git';
const LOG = path.join(ROOT, 'backend', 'scripts', 'sync-missing.log');
const MISSING = path.join(ROOT, 'backend', 'scripts', 'missing-product-urls.txt');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const INVALID_PATTERNS = [
  /^amway\.co\.kr$/i,
  /captcha/i,
  /too many requests/i,
  /verify you are human/i,
  /잠시만 기다려 주세요/i,
];

function isInvalidProduct(p: { name: string; price: number; description?: string | null; benefits?: string | null }) {
  const texts = [p.name, p.description ?? '', p.benefits ?? ''].join(' ');
  if (p.price === 0) return true;
  return INVALID_PATTERNS.some((re) => re.test(texts));
}

async function main() {
  // 1) 무효 레코드 정리
  const invalid = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: 'amway.co.kr' },
        { price: 0 },
        { description: { contains: 'captcha' } },
        { description: { contains: 'Too Many Requests' } },
        { benefits: { contains: 'captcha' } },
      ],
    },
    select: { id: true, code: true, name: true, price: true },
  });
  console.log(`[cleanup] 무효 후보 ${invalid.length}개`);

  const reallyInvalid = [];
  for (const p of invalid) {
    const full = await prisma.product.findUnique({ where: { id: p.id } });
    if (full && isInvalidProduct(full)) reallyInvalid.push(p.id);
  }
  if (reallyInvalid.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: reallyInvalid } } });
  }
  console.log(`[cleanup] 무효 레코드 ${reallyInvalid.length}개 삭제 완료`);

  // 2) 실패 URL 재시도
  const log = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8') : '';
  const failUrls = [...log.matchAll(/FAIL (https:\/\/www\.amway\.co\.kr[^\s:]+)/g)].map((m) => m[1]);
  console.log(`[cleanup] 실패 URL ${failUrls.length}개 재시도`);

  const missingLines = fs.existsSync(MISSING) ? fs.readFileSync(MISSING, 'utf8') : '';
  const urlToCategory = new Map<string, string>();
  for (const line of missingLines.split(/\r?\n/)) {
    const idx = line.lastIndexOf('|');
    if (idx > -1) {
      urlToCategory.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
    }
  }

  let ok = 0;
  let fail = 0;
  for (const url of failUrls) {
    const category = urlToCategory.get(url) || '기타';
    try {
      const r = await syncProductFromUrl(url, { category });
      ok++;
      console.log(`[cleanup] 재시도 성공: ${r.name} (${r.price}원) - ${category}`);
    } catch (err: any) {
      fail++;
      console.warn(`[cleanup] 재시도 실패: ${url} - ${err?.message || err}`);
    }
    await sleep(3000);
  }
  console.log(`[cleanup] 재시도 결과: 성공 ${ok}, 실패 ${fail}`);

  // 3) 최종 집계
  const total = await prisma.product.count({ where: { isActive: true } });
  const byCat = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  console.log(`[cleanup] 최종 활성 상품: ${total}개`);
  for (const c of byCat) {
    console.log(`  ${c.category}: ${c._count.id}`);
  }
}

main()
  .catch((err) => {
    console.error('[cleanup] 오류:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
