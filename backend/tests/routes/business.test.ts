import request from 'supertest';
import { describe, expect, it } from 'vitest';
import businessRoutes from '../../src/routes/business';
import { buildApp } from '../helpers/app';

describe('GET /stp', () => {
  it('사업 설명 단계를 반환한다', async () => {
    const res = await request(buildApp(businessRoutes)).get('/stp');

    expect(res.status).toBe(200);
    expect(res.body.headline).toBe('암웨이 ABO 사업 설명');
    expect(res.body.steps.map((s: any) => s.title)).toEqual(['보상 플랜', '자산 가치', '친환경 ESG']);
  });
});
