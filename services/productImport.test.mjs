// Kiểm chứng phần bóc JSON trong câu trả lời của model.
//
// Đây là chỗ đã hỏng thật khi chạy trên catalogue 46 trang của Naris: cùng một
// prompt, cùng một tài liệu, lần đầu model trả JSON thuần, lần sau lại thêm dấu
// ``` đóng ở cuối mà không có ``` mở - và cách bắt cặp fence cũ trượt hoàn toàn,
// làm hỏng cả câu trả lời 30.000 ký tự đúng nội dung.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let mod;

before(async () => {
  const { build } = await import(`file:///${join(ROOT, 'node_modules/esbuild/lib/main.js').replace(/\\/g, '/')}`);
  const outfile = join(tmpdir(), `product-import-${process.pid}.mjs`);
  await build({
    entryPoints: [join(HERE, 'productImport.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'error',
  });
  mod = await import(`file:///${outfile.replace(/\\/g, '/')}`);
});

const BODY = '{"products":[{"name":"Lotion","line":"URUOI COLLAGEN","details":"Giá: 495.000đ"}]}';

const parse = (raw) => JSON.parse(mod.extractJson(raw));

test('JSON thuần thì giữ nguyên', () => {
  assert.equal(parse(BODY).products[0].name, 'Lotion');
});

test('JSON bọc trong khối markdown đầy đủ', () => {
  assert.equal(parse('```json\n' + BODY + '\n```').products[0].name, 'Lotion');
});

test('Chỉ có dấu rào đóng ở cuối - đúng ca đã làm hỏng bản cũ', () => {
  assert.equal(parse(BODY + '```').products[0].name, 'Lotion');
});

test('Dấu rào đóng kèm cả đống khoảng trắng phía sau', () => {
  assert.equal(parse(BODY + '```' + ' '.repeat(500)).products[0].name, 'Lotion');
});

test('Model nói vài câu trước khi đưa JSON', () => {
  assert.equal(parse('Đây là danh mục tôi đọc được:\n\n' + BODY).products[0].name, 'Lotion');
});

test('Model nói thêm sau JSON', () => {
  assert.equal(parse(BODY + '\n\nHy vọng giúp ích cho bạn.').products[0].name, 'Lotion');
});

test('Trả về mảng trần thay vì object bọc ngoài', () => {
  const arr = '[{"name":"Lotion","line":"","details":""}]';
  assert.equal(parse(arr)[0].name, 'Lotion');
});

test('Chuỗi không có JSON thì trả nguyên văn để lỗi hiện ra rõ', () => {
  assert.equal(mod.extractJson('Tôi không đọc được tài liệu này.'), 'Tôi không đọc được tài liệu này.');
});
