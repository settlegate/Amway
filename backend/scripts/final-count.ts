import { prisma } from '../src/lib/db';

async function main() {
  const total = await prisma.product.count({ where: { isActive: true } });
  const invalid = await prisma.product.count({
    where: {
      isActive: true,
      OR: [
        { name: 'amway.co.kr' },
        { price: 0 },
        { description: { contains: 'captcha' } },
        { description: { contains: 'Too Many Requests' } },
      ],
    },
  });
  console.log(`total=${total} invalid=${invalid}`);
}

main().finally(() => prisma.$disconnect());
