// 기존 평문 개인정보를 AES-256-GCM(v1 형식)으로 암호화하는 일회성 마이그레이션.
// 실행: npx tsx scripts/encrypt-pii.ts  (backend/ 기준, ENCRYPTION_KEY 필요)
import { prisma } from '../src/lib/db';
import { encrypt } from '../src/lib/crypto';

const isEncrypted = (v: string | null | undefined) => !!v && v.startsWith('v1:');

async function main() {
  const apps = await prisma.seminarApplication.findMany();
  let migrated = 0;
  for (const a of apps) {
    if (isEncrypted(a.name) && isEncrypted(a.phone)) continue;
    await prisma.seminarApplication.update({
      where: { id: a.id },
      data: {
        name: isEncrypted(a.name) ? a.name : encrypt(a.name),
        phone: isEncrypted(a.phone) ? a.phone : encrypt(a.phone),
      },
    });
    migrated += 1;
  }
  console.log(`세미나 신청 ${apps.length}건 중 ${migrated}건 암호화 완료`);
}

main()
  .catch((err) => {
    console.error('마이그레이션 실패:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
