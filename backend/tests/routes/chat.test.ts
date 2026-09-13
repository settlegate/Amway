import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import chatRoutes from '../../src/routes/chat';
import { analyzeBodyImage, generateHealthReply } from '../../src/lib/ai';
import { buildApp } from '../helpers/app';

vi.mock('../../src/lib/ai', () => ({ analyzeBodyImage: vi.fn(), generateHealthReply: vi.fn() }));

const analyze = vi.mocked(analyzeBodyImage);
const reply = vi.mocked(generateHealthReply);
const app = buildApp(chatRoutes);

describe('POST /', () => {
  it.each([{}, { message: '   ' }, { message: 123 }])('메시지가 없으면 400을 반환한다 (%o)', async (body) => {
    const res = await request(app).post('/').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('message가 필요합니다.');
  });

  it('메시지를 trim 하여 답변을 생성한다', async () => {
    reply.mockResolvedValue({ text: '답변', products: [], source: 'mock' });
    const history = [{ role: 'user', text: '이전' }];
    const bodyMetrics = { bodyFatPercent: 30 };

    const res = await request(app).post('/').send({ message: '  피곤해요 ', userId: 'u1', history, bodyMetrics });

    expect(analyze).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith({ message: '피곤해요', userId: 'u1', history, bodyMetrics });
    expect(res.body).toEqual({ text: '답변', products: [], source: 'mock', bodyResult: bodyMetrics });
  });

  it('이미지가 있으면 체성분을 분석하고 기본 질문으로 답변한다', async () => {
    analyze.mockResolvedValue({
      skeletalMuscleKg: 20,
      bodyFatPercent: 31,
      visceralFatLevel: 9,
      bodyType: '체지방 과다형',
      confidence: 'high',
      valid: true,
      summary: 'ignored',
    } as any);
    reply.mockResolvedValue({ text: '답변', products: [], source: 'openai' });

    const res = await request(app).post('/').send({ imageBase64: 'BASE64' });

    expect(analyze).toHaveBeenCalledWith({ imageBase64: 'BASE64', mimeType: 'image/png' });
    const expectedMetrics = {
      skeletalMuscleKg: 20,
      bodyFatPercent: 31,
      visceralFatLevel: 9,
      bodyType: '체지방 과다형',
      confidence: 'high',
      valid: true,
    };
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      message: '인바디 결과지를 분석하고 맞는 상품을 추천해줘',
      bodyMetrics: expectedMetrics,
    }));
    expect(res.body.bodyResult).toEqual(expectedMetrics);
  });

  it('이미지와 메시지를 함께 보내면 사용자 메시지와 MIME 타입을 유지한다', async () => {
    analyze.mockResolvedValue({ valid: false } as any);
    reply.mockResolvedValue({ text: '답변', products: [], source: 'openai' });

    await request(app).post('/').send({ imageBase64: 'BASE64', mimeType: 'image/jpeg', message: '분석해줘' });

    expect(analyze).toHaveBeenCalledWith({ imageBase64: 'BASE64', mimeType: 'image/jpeg' });
    expect(reply.mock.calls[0][0].message).toBe('분석해줘');
  });

  it('답변 생성 중 오류가 나면 500을 반환한다', async () => {
    reply.mockRejectedValue(new Error('fail'));

    const res = await request(app).post('/').send({ message: '안녕' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('응답 생성 중 오류가 발생했습니다.');
  });
});
