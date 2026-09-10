import { syncProductFromUrl } from '../src/lib/amwayProduct';
import { prisma } from '../src/lib/db';

async function main() {
  const url = process.argv[2];
  const category = process.argv[3] || '기타';
  if (!url) {
    console.error('Usage: tsx retry-one.ts <url> [category]');
    process.exit(1);
  }
  const r = await syncProductFromUrl(url, { category });
  console.log(`OK ${r.name} (${r.price}원)`);
}

main()
  .catch((e) => {
    console.error('FAIL:', e?.message || e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
