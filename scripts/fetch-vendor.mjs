// Tải sẵn công cụ tải video vào vendor/ để bộ cài Windows mang theo luôn.
//
// Trước bản 2.0.2, người tải app về phải tự cài Python rồi chạy `pip install
// yt-dlp`, nếu không thì mọi link YouTube, TikTok, Facebook, Instagram đều báo
// "Không tìm thấy yt-dlp trên máy chủ". Đó là rào cản với đúng nhóm người dùng
// mà app hướng tới, nên công cụ này đi kèm bộ cài.
//
// Hai file, đều là bản chạy độc lập không cần cài gì thêm:
//   yt-dlp.exe  (~17 MB) tải video từ nền tảng.
//   ffmpeg.exe  (~79 MB) ghép hình với tiếng. YouTube phát hình và tiếng thành
//               hai luồng riêng và không còn định dạng gộp sẵn, nên thiếu file
//               này thì link YouTube tải về chỉ ra một video câm.
//
// vendor/ không commit vào repo (xem .gitignore); script chạy tự động trước
// `npm run dist`.

import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, stat, rm, rename } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const VENDOR = path.join(HERE, '..', 'vendor');

const TOOLS = [
  {
    name: 'yt-dlp.exe',
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    gzipped: false,
    // Nhỏ hơn mức này thì chắc chắn tải hỏng: bản thật khoảng 17 MB.
    minBytes: 10 * 1024 * 1024,
    versionArgs: ['--version'],
  },
  {
    name: 'ffmpeg.exe',
    // Bản build tĩnh của ffmpeg-static: một file .exe, không kèm dll.
    url: 'https://github.com/eugeneware/ffmpeg-static/releases/latest/download/ffmpeg-win32-x64.gz',
    gzipped: true,
    minBytes: 40 * 1024 * 1024,
    versionArgs: ['-version'],
  },
];

const sizeOf = async (file) => {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
};

const versionOf = async (file, args) => {
  try {
    const { stdout } = await execFileAsync(file, args, { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
    return stdout.toString().trim().split('\n')[0].slice(0, 60);
  } catch {
    // File có thể đang bị Defender giữ; không đọc được phiên bản cũng không sao.
    return '';
  }
};

const fetchTo = async (tool, target) => {
  const res = await fetch(tool.url, { redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`GitHub trả về ${res.status} khi tải ${tool.name}`);

  const tmp = target + '.part';
  await pipeline(res.body, createWriteStream(tmp));

  let finalTmp = tmp;
  if (tool.gzipped) {
    const unzipped = target + '.raw';
    await pipeline(createReadStream(tmp), createGunzip(), createWriteStream(unzipped));
    await rm(tmp, { force: true });
    finalTmp = unzipped;
  }

  const size = await sizeOf(finalTmp);
  if (size < tool.minBytes) {
    await rm(finalTmp, { force: true });
    throw new Error(`${tool.name} tải về chỉ ${(size / 1048576).toFixed(1)} MB, không phải bản đầy đủ.`);
  }

  await rm(target, { force: true });
  await rename(finalTmp, target);
  return size;
};

const main = async () => {
  await mkdir(VENDOR, { recursive: true });
  const force = process.argv.includes('--force');

  for (const tool of TOOLS) {
    const target = path.join(VENDOR, tool.name);
    const existing = await sizeOf(target);

    if (existing >= tool.minBytes && !force) {
      const version = await versionOf(target, tool.versionArgs);
      console.log(`[vendor] đã có ${tool.name} (${(existing / 1048576).toFixed(1)} MB${version ? `, ${version}` : ''})`);
      continue;
    }

    console.log(`[vendor] đang tải ${tool.name}...`);
    const size = await fetchTo(tool, target);
    const version = await versionOf(target, tool.versionArgs);
    console.log(`[vendor] xong ${tool.name}: ${(size / 1048576).toFixed(1)} MB${version ? `, ${version}` : ''}`);
  }

  console.log('[vendor] Thêm --force để tải lại bản mới nhất.');
};

main().catch((err) => {
  console.error('[vendor] KHÔNG tải được công cụ:', err?.message || err);
  console.error('[vendor] Bộ cài sẽ thiếu công cụ tải video. Kiểm tra mạng rồi chạy lại: node scripts/fetch-vendor.mjs --force');
  process.exit(1);
});
