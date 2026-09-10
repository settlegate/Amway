import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const products = await prisma.product.findMany({
    where: { aClicUrl: { not: null } },
  });

  for (const p of products) {
    const sku = p.aClicUrl!.split('/p/').pop()!.split('?')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (!sku) {
      console.log(`[image] ${p.name}: SKU 추출 실패`);
      continue;
    }

    async function fetchText(url: string): Promise<string> {
      const res = await fetch(`https://r.jina.ai/${url}`);
      return res.ok ? res.text() : '';
    }

    try {
      let text = await fetchText(p.aClicUrl!);
      if (!text) {
        const apiUrl = p.aClicUrl!.replace('https://www.amway.co.kr', 'https://api.amway.co.kr');
        text = await fetchText(apiUrl);
      }

      if (!text) {
        console.log(`[image] ${p.name}: Jina fetch 실패`);
        continue;
      }

      const candidates = [
        `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_1_640_R\\.jpg`,
        `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_640_R\\.jpg`,
        `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_1_640\\.jpg`,
        `https://media\\.amway\\.co\\.kr/sys-master/images/[^\\s"\\]]*NU_${sku}_\\d+\\.jpg`,
      ];

      let match: RegExpMatchArray | null = null;
      for (const pattern of candidates) {
        match = text.match(new RegExp(pattern, 'i'));
        if (match) break;
      }

      if (match) {
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl: match[0] },
        });
        console.log(`[image] ${p.name} -> ${match[0]}`);
      } else {
        console.log(`[image] ${p.name}: 이미지 URL을 찾지 못했습니다. (SKU: ${sku})`);
      }

      await sleep(500);
    } catch (err) {
      console.error(`[image] ${p.name}:`, err);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
