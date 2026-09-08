import test from 'node:test';
import assert from 'node:assert/strict';
import { douyinIdFrom, isDouyinUrl } from './douyinVideo.mjs';

test('douyinIdFrom reads every link shape people paste', () => {
  assert.equal(douyinIdFrom('https://www.douyin.com/video/6961737553342991651'), '6961737553342991651');
  assert.equal(douyinIdFrom('https://www.douyin.com/video/6961737553342991651?previous_page=app_code_link'), '6961737553342991651');
  assert.equal(douyinIdFrom('https://www.iesdouyin.com/share/video/7412345678901234567/?region=CN&mid=1'), '7412345678901234567');
  assert.equal(douyinIdFrom('https://www.douyin.com/note/7412345678901234567'), '7412345678901234567');
  assert.equal(douyinIdFrom('https://www.douyin.com/user/MS4wLjABAAAA?modal_id=7412345678901234567'), '7412345678901234567');
  assert.equal(douyinIdFrom('https://www.douyin.com/discover?vid=7412345678901234567'), '7412345678901234567');
});

test('douyinIdFrom returns empty for links that name no video', () => {
  assert.equal(douyinIdFrom('https://www.douyin.com/'), '');
  assert.equal(douyinIdFrom('https://www.douyin.com/user/MS4wLjABAAAA'), '');
  assert.equal(douyinIdFrom('https://v.douyin.com/iAbCdEf/'), '');
  assert.equal(douyinIdFrom(''), '');
});

test('isDouyinUrl matches douyin hosts only', () => {
  assert.equal(isDouyinUrl('https://v.douyin.com/iAbCdEf/'), true);
  assert.equal(isDouyinUrl('https://www.iesdouyin.com/share/video/1/'), true);
  assert.equal(isDouyinUrl('https://www.tiktok.com/@a/video/1'), false);
  assert.equal(isDouyinUrl('not a url'), false);
});
