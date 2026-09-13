import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let tmpDir: string;
let uploadDir: string;

async function load() {
  vi.resetModules();
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  return import('../../src/lib/upload');
}

async function buildApp() {
  const { uploadPromo } = await load();
  const app = express();
  app.post('/upload', uploadPromo.single('image'), (req, res) => {
    res.json({ file: req.file ?? null });
  });
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(413).json({ error: err.code });
  });
  return app;
}

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amway-upload-'));
  uploadDir = path.join(tmpDir, 'public', 'uploads');
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('uploadPromo', () => {
  it('업로드 디렉터리가 없으면 생성하고, 이미 있으면 그대로 사용한다', async () => {
    expect(fs.existsSync(uploadDir)).toBe(false);
    await load();
    expect(fs.existsSync(uploadDir)).toBe(true);

    await expect(load()).resolves.toHaveProperty('uploadPromo');
  });

  it('이미지 파일을 promo-* 이름으로 저장한다', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('png'), { filename: 'banner.webp', contentType: 'image/webp' });

    expect(res.body.file.filename).toMatch(/^promo-\d+-[a-z0-9]+\.webp$/);
    expect(res.body.file.destination).toBe(uploadDir);
    expect(fs.existsSync(path.join(uploadDir, res.body.file.filename))).toBe(true);
  });

  it('확장자가 없으면 .png를 붙인다', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('png'), { filename: 'blob', contentType: 'image/png' });

    expect(res.body.file.filename).toMatch(/\.png$/);
  });

  it('허용되지 않은 MIME 타입은 저장하지 않는다', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('text'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.body.file).toBeNull();
  });

  it('5MB를 초과하는 파일은 거부한다', async () => {
    const app = await buildApp();

    const res = await request(app)
      .post('/upload')
      .attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe('LIMIT_FILE_SIZE');
  });
});
