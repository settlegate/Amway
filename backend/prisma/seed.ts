import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    code: 'DOUBLEX',
    name: '더블엑스 (124정X3팩, 31일분)',
    category: '비타민/미네랄',
    description: '56가지 식물농축물과 19종 비타민·미네랄이 골고루 담긴 종합영양제예요.',
    benefits: '면역 기능, 활성산소 저항, 에너지 대사',
    dosage: '식후 1포',
    price: 91000,
    salesVolume: 5200,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h9f/h4b/9386258694174/NU_120843K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/120843K',
  },
  {
    code: 'BODYKEY',
    name: '바디키 식사대용 쉐이크 그레인 (14포)',
    category: '체중/체성분',
    description: '식사 대용으로 간편하게 즐기는 쉐이크예요.',
    benefits: '체지방 감소, 근육량 유지, 식후 혈당 상승 억제',
    dosage: '식전 1포',
    price: 55000,
    salesVolume: 4100,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h51/h10/9477858787358/NU_315512_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/bodykey/p/315512',
  },
  {
    code: 'OMEGA3',
    name: '뉴트리 마린 오메가-3 (120캡슐, 30일분)',
    category: '식물영양소',
    description: 'EPA·DHA가 풍부한 오메가-3로 일상 건강 관리에 좋아요.',
    benefits: '혈중 중성지방 개선, 혈행 개선, 기억력 개선',
    dosage: '식후 2정',
    price: 53000,
    salesVolume: 3500,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h9c/hae/9363112362014/NU_126138K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/functional/p/126138K',
  },
  {
    code: 'PROTEIN',
    name: '뉴트리 파이토 푸로틴 (900g)',
    category: '단백질',
    description: '식물성 단백질을 담아 근육량과 포만감을 함께 챙겨요.',
    benefits: '근육량 증가, 식이섬유 보충, 포만감',
    dosage: '운동 후 1스푼',
    price: 85000,
    salesVolume: 2800,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/hc2/h58/9410955804702/NU_122594K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/proteins/p/122594K',
  },
  {
    code: 'VITAMINC',
    name: '올데이 비타민 C 플러스 (60정, 60일분)',
    category: '비타민/미네랄',
    description: '비타민C로 하루 한 번 편하게 챙기세요.',
    benefits: '면역 기능, 피로 개선, 항산화',
    dosage: '식후 1정',
    price: 45000,
    salesVolume: 2200,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h90/he2/9473915879454/NU_109745K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/109745K',
  },
  {
    code: 'CALMAG',
    name: '칼맥 디 (120정, 30일분)',
    category: '뼈/관절',
    description: '칼슘과 마그네슘을 균형 있게 담아 뼈 건강에 신경 쓰시는 분께 권해드려요.',
    benefits: '뼈 형성, 근육 수축, 신경 전달',
    dosage: '식후 2정',
    price: 34000,
    salesVolume: 1800,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h5f/h19/9410922250270/NU_110607K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/110607K',
  },
  {
    code: 'PROBIOTIC',
    name: '밸런스 위드인 365 (30포, 30일분)',
    category: '유산균',
    description: '장 건강을 챙기는 데 도움을 주는 프로바이오틱 제품이에요.',
    benefits: '장 건강, 유해균 억제, 배변 활동 원활',
    dosage: '식후 1포',
    price: 45000,
    salesVolume: 1500,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/hd2/h0b/9410922643486/NU_125405K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/basic/probiotic-fibers/p/125405K',
  },
  {
    code: 'COQ10',
    name: '코큐텐 (90캡슐, 30일분)',
    category: '기능성',
    description: '코엔자임 Q10을 담아 활력 있는 일상에 도움을 줄 수 있어요.',
    benefits: '항산화, 에너지 대사, 활력',
    dosage: '식후 1정',
    price: 48000,
    salesVolume: 1200,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/hd7/ha7/9386254794782/NU_105684K_1_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/functional/p/105684K',
  },
  {
    code: 'LIVER',
    name: '밀크씨슬 이엑스 (60정, 30일분)',
    category: '기능성',
    description: '밀크씨슬 추출물을 담아 간 건강을 챙기시는 분께 권해드려요.',
    benefits: '간 건강, 항산화, 에너지 대사',
    dosage: '식후 2정',
    price: 46000,
    salesVolume: 1100,
    imageUrl: 'https://media.amway.co.kr/sys-master/images/h2f/hce/9298384977950/NU_100352K_640_R.jpg',
    aClicUrl: 'https://www.amway.co.kr/shop/nutrition/functional/p/100352K',
  },
];

async function main() {
  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log(`[seed] ${PRODUCTS.length}개 제품 삽입/업데이트 완료`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('[seed] 오류:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
