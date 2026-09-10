import cron from 'node-cron';
import { generateNewsletter } from './ai';
import { sendFriendTalk } from './kakao';
import { prisma } from './db';

export function initCronJobs() {
  if (process.env.NODE_ENV === 'test') return;

  // 매달 1일 09:00 월간 뉴스레터
  cron.schedule('0 9 1 * *', async () => {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const newsletterText = await generateNewsletter(month);

      const subscribers = await prisma.user.findMany({
        where: { isAgreed: true },
      });

      for (const user of subscribers) {
        if (user.kakaoId) {
          await sendFriendTalk(user.kakaoId, newsletterText, 'monthly-newsletter');
        }
      }
      console.log(`[cron] ${month} 뉴스레터 발송 완료 (대상 ${subscribers.length}명)`);
    } catch (err) {
      console.error('[cron] 뉴스레터 발송 오류:', err);
    }
  });

  // 매분 복용 리마인더 (DB의 intakeTime이 "HH:MM" 형식)
  cron.schedule('* * * * *', async () => {
    try {
      const today = new Date();
      const hh = String(today.getHours()).padStart(2, '0');
      const mm = String(today.getMinutes()).padStart(2, '0');
      const time = `${hh}:${mm}`;

      const reminders = await prisma.reminder.findMany({
        where: { active: true, intakeTime: time },
        include: { user: true },
      });

      for (const r of reminders) {
        if (r.user?.kakaoId) {
          const message = `${r.intakeTime} ${r.productName} 복용 시간입니다! 💊`;
          await sendFriendTalk(r.user.kakaoId, message, 'daily-reminder');
        }
      }
      if (reminders.length > 0) {
        console.log(`[cron] 복용 리마인더 발송 완료 (대상 ${reminders.length}명, ${time})`);
      }
    } catch (err) {
      console.error('[cron] 복용 리마인더 발송 오류:', err);
    }
  });
}
