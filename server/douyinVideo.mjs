// Douyin video files, fetched the one way that still works.
//
// Douyin's web detail API answers 403 to yt-dlp whatever cookies it carries
// (checked 07/09/2026 with yt-dlp 2026.08.19 and a freshly minted anonymous
// session, and reported upstream all year), and neither the crawler page nor
// the desktop page carries a play URL. TikHub - the same paid API the Radar
// already uses for Douyin - returns the CDN links for one video, and those
// links download with a plain HTTP client. So a Douyin link goes through
// TikHub when a key is available, and only falls back to yt-dlp without one.

import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import path from 'node:path';
import { tikhubRequest, get, firstUrl, num, str } from './radar/providers/tikhubClient.mjs';

export const DOUYIN_HOST_RE = /(^|\.)(?:douyin|iesdouyin)\.com$/i;

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const DOWNLOAD_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * The video id in any of the link shapes people actually paste:
 *   douyin.com/video/<id>           the address bar on a video page
 *   iesdouyin.com/share/video/<id>  where a v.douyin.com share link lands
 *   douyin.com/note/<id>            an image post
 *   douyin.com/user/...?modal_id=<id>  a video opened from a profile or feed
 * Returns '' when the link names no video.
 */
export const douyinIdFrom = (raw) => {
  const text = String(raw || '');
  const m =
    text.match(/\/(?:share\/)?(?:video|note)\/(\d{6,})/) ||
    text.match(/[?&](?:modal_id|vid|aweme_id)=(\d{6,})/);
  return m ? m[1] : '';
};

export const isDouyinUrl = (raw) => {
  try {
    return DOUYIN_HOST_RE.test(new URL(raw).hostname);
  } catch {
    return false;
  }
};

const toUploadDate = (epochSec) => {
  const n = num(epochSec);
  if (!n) return '';
  return new Date(n * 1000).toISOString().slice(0, 10).replace(/-/g, '');
};

const hashtagsOf = (aweme) => {
  const tags = [];
  for (const entry of get(aweme, 'text_extra') || []) {
    const name = str(entry?.hashtag_name);
    if (name) tags.push('#' + name);
  }
  for (const m of String(aweme?.desc || '').matchAll(/#[\p{L}\p{N}_]+/gu)) tags.push(m[0]);
  return [...new Set(tags)];
};

/**
 * Asks TikHub for one Douyin post. Returns the file candidates (best quality
 * first) and the same VideoMeta shape yt-dlp-backed links produce, so the rest
 * of the pipeline cannot tell the two apart.
 */
export const fetchDouyinViaTikhub = async (awemeId, { apiKey } = {}) => {
  const json = await tikhubRequest('/api/v1/douyin/app/v3/fetch_one_video', {
    query: { aweme_id: awemeId },
    apiKey,
  });

  const aweme = get(json, 'data.aweme_detail') || get(json, 'data.aweme_details.0') || get(json, 'data');
  if (!aweme || typeof aweme !== 'object' || !aweme.video) {
    throw new Error('TikHub không trả về video cho link này. Video có thể đã bị xóa, ở chế độ riêng tư, hoặc là bài ảnh.');
  }

  const video = aweme.video;
  const candidates = [];
  const push = (addr) => {
    const url = firstUrl(addr);
    if (!url) return;
    candidates.push({
      url,
      // Every mirror in url_list serves the same file; keep the others as spares.
      mirrors: (addr?.url_list || []).filter((u) => typeof u === 'string' && u !== url),
      size: num(addr?.data_size),
      width: num(addr?.width),
      height: num(addr?.height),
    });
  };
  // play_addr is the original upload; bit_rate holds the transcodes, highest first.
  push(video.play_addr);
  for (const variant of [...(video.bit_rate || [])].sort((a, b) => num(b?.bit_rate) - num(a?.bit_rate))) {
    push(variant?.play_addr);
  }
  if (!candidates.length) {
    throw new Error('TikHub trả về bài đăng nhưng không có link file video (có thể là bài ảnh hoặc video đã bị gỡ).');
  }

  const stats = aweme.statistics || {};
  const music = aweme.music || {};
  const desc = str(aweme.desc) || '';
  const durationMs = num(video.duration) ?? num(aweme.duration);
  const cover = firstUrl(video.cover) || firstUrl(video.origin_cover) || firstUrl(video.dynamic_cover) || '';

  const meta = {
    id: str(aweme.aweme_id) || String(awemeId),
    platform: 'Douyin',
    title: desc,
    description: desc,
    hashtags: hashtagsOf(aweme),
    durationSec: durationMs ? Math.round(durationMs / 1000) : null,
    viewCount: num(stats.play_count) || null,
    likeCount: num(stats.digg_count),
    commentCount: num(stats.comment_count),
    shareCount: num(stats.share_count),
    uploader: str(get(aweme, 'author.nickname')) || str(get(aweme, 'author.unique_id')) || '',
    uploadDate: toUploadDate(aweme.create_time),
    soundtrack: [str(music.title), str(music.author)].filter(Boolean).join(' - '),
    thumbnail: cover,
    webpageUrl: `https://www.douyin.com/video/${str(aweme.aweme_id) || awemeId}`,
    sizeBytes: 0,
  };

  return { meta, candidates };
};

const downloadOne = async (url, filePath, maxBytes) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': DOWNLOAD_UA, Referer: 'https://www.douyin.com/' },
    });
    if (!res.ok || !res.body) throw new Error(`CDN trả về ${res.status}`);

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error(`File is larger than max-filesize (${declared} bytes)`);

    let written = 0;
    const cap = new Transform({
      transform(chunk, _enc, cb) {
        written += chunk.length;
        if (written > maxBytes) {
          cb(new Error(`File is larger than max-filesize (${written}+ bytes)`));
          return;
        }
        cb(null, chunk);
      },
    });
    await pipeline(res.body, cap, createWriteStream(filePath));
    if (!written) throw new Error('CDN trả về file rỗng');
    return written;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Downloads the first candidate that fits under maxBytes, trying each mirror.
 * Returns the file path and size. Throws with the last error when none worked.
 */
export const downloadDouyinFile = async (candidates, dir, maxBytes) => {
  const filePath = path.join(dir, 'source.mp4');
  let lastErr = null;
  for (const candidate of candidates) {
    if (candidate.size && candidate.size > maxBytes) continue;
    for (const url of [candidate.url, ...candidate.mirrors]) {
      try {
        const size = await downloadOne(url, filePath, maxBytes);
        return { filePath, size, width: candidate.width, height: candidate.height };
      } catch (err) {
        lastErr = err;
        console.log(`[douyin] không tải được từ ${new URL(url).hostname}: ${err?.message || err}`);
      }
    }
  }
  throw lastErr || new Error('Không có bản video nào nằm trong giới hạn dung lượng.');
};
