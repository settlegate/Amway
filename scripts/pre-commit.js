const { execSync } = require('child_process');

const BLOCKED_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..+\.local$/,
  /\.db$/,
  /\.db-journal$/,
];

function isBlocked(file) {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(file));
}

function main() {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const stagedFiles = output.split('\n').filter(Boolean);
    const blocked = stagedFiles.filter(isBlocked);

    if (blocked.length > 0) {
      console.error('');
      console.error('ERROR: 아래 파일은 커밋할 수 없습니다.');
      console.error('      .env, 개발 DB 파일 등 secret/환경 의존 파일은 git에 포함하지 마세요.');
      console.error('');
      for (const file of blocked) {
        console.error(`  - ${file}`);
      }
      console.error('');
      console.error('해당 파일을 unstaging 한 뒤 다시 커밋해 주세요.');
      console.error('  git restore --staged <file>');
      console.error('');
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error('pre-commit hook error:', err);
    process.exit(1);
  }
}

main();
