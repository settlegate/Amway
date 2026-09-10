import { Router } from 'express';

const router = Router();

router.get('/stp', (_req, res) => {
  res.json({
    headline: '암웨이 ABO 사업 설명',
    steps: [
      {
        title: '보상 플랜',
        description: '개인 사용 + 후원을 통한 수당 구조를 쉬운 비유로 설명합니다.',
        options: ['수당 계산법 보기', '자산 구축 원리', '1:1 사업 상담'],
      },
      {
        title: '자산 가치',
        description: '안정적인 파트너십과 지속 가능한 수익 창출 기반을 소개합니다.',
        options: ['성공 사례 보기', '월간 로드맵 받기'],
      },
      {
        title: '친환경 ESG',
        description: '암웨이의 지속가능한 제품 철학과 사회적 가치를 전달합니다.',
        options: ['ESG 리포트 보기', '제품 라인업 보기'],
      },
    ],
  });
});

export default router;
