import { afterEach, describe, expect, it, vi } from 'vitest';
import cron from 'node-cron';
import { initCronJobs } from '../../src/lib/cron';
import { generateNewsletter } from '../../src/lib/ai';
import { sendFriendTalk } from '../../src/lib/kakao';
import { prisma as prismaImport } from '../../src/lib/db';
import type { PrismaMock } from '../helpers/prismaMock';

vi.mock('node-cron', () => ({ default: { schedule: vi.fn() } }));
vi.mock('../../src/lib/ai', () => ({ generateNewsletter: vi.fn() }));
vi.mock('../../src/lib/kakao', () => ({ sendFriendTalk: vi.fn() }));
vi.mock('../../src/lib/db', () => import('../helpers/prismaMock'));

const prisma = prismaImport as unknown as PrismaMock;
const schedule = vi.mocked(cron.schedule);

function start() {
  vi.stubEnv('NODE_ENV', 'production');
  initCronJobs();
  const jobs = Object.fromEntries(schedule.mock.calls.map(([expr, fn]) => [expr, fn as () => Promise<void>]));
  return { newsletter: jobs['0 9 1 * *'], reminder: jobs['* * * * *'] };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('initCronJobs', () => {
  it('테스트 환경에서는 스케줄을 등록하지 않는다', () => {
    initCronJobs();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('월간 뉴스레터와 복용 리마인더 작업을 등록한다', () => {
    const { newsletter, reminder } = start();
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(newsletter).toBeTypeOf('function');
    expect(reminder).toBeTypeOf('function');
  });

  describe('월간 뉴스레터', () => {
    it('동의한 사용자 중 카카오 ID가 있는 사용자에게 발송한다', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 2, 1, 9, 0));
      vi.mocked(generateNewsletter).mockResolvedValue('3월 소식');
      prisma.user.findMany.mockResolvedValue([{ kakaoId: 'k1' }, { kakaoId: null }]);
      const { newsletter } = start();

      await newsletter();

      expect(generateNewsletter).toHaveBeenCalledWith('2026-03');
      expect(prisma.user.findMany).toHaveBeenCalledWith({ where: { isAgreed: true } });
      expect(sendFriendTalk).toHaveBeenCalledTimes(1);
      expect(sendFriendTalk).toHaveBeenCalledWith('k1', '3월 소식', 'monthly-newsletter');
    });

    it('오류가 나도 예외를 던지지 않고 로그를 남긴다', async () => {
      vi.mocked(generateNewsletter).mockRejectedValue(new Error('fail'));
      const { newsletter } = start();

      await expect(newsletter()).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('[cron] 뉴스레터 발송 오류:', expect.any(Error));
    });
  });

  describe('복용 리마인더', () => {
    it('현재 시각(HH:MM)에 해당하는 리마인더를 발송한다', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 8, 13, 8, 5));
      prisma.reminder.findMany.mockResolvedValue([
        { intakeTime: '08:05', productName: '더블엑스', user: { kakaoId: 'k1' } },
        { intakeTime: '08:05', productName: '오메가', user: { kakaoId: null } },
        { intakeTime: '08:05', productName: '루테인', user: null },
      ]);
      const { reminder } = start();

      await reminder();

      expect(prisma.reminder.findMany).toHaveBeenCalledWith({
        where: { active: true, intakeTime: '08:05' },
        include: { user: true },
      });
      expect(sendFriendTalk).toHaveBeenCalledTimes(1);
      expect(sendFriendTalk).toHaveBeenCalledWith('k1', '08:05 더블엑스 복용 시간입니다! 💊', 'daily-reminder');
      expect(console.log).toHaveBeenCalled();
    });

    it('대상이 없으면 로그를 남기지 않는다', async () => {
      prisma.reminder.findMany.mockResolvedValue([]);
      const { reminder } = start();

      await reminder();

      expect(console.log).not.toHaveBeenCalled();
    });

    it('오류가 나도 예외를 던지지 않고 로그를 남긴다', async () => {
      prisma.reminder.findMany.mockRejectedValue(new Error('db'));
      const { reminder } = start();

      await expect(reminder()).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('[cron] 복용 리마인더 발송 오류:', expect.any(Error));
    });
  });
});
