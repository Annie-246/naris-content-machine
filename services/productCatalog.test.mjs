// Kiểm chứng bộ đọc danh mục sản phẩm trên đúng hình dạng file người dùng đưa vào:
// bảng xuất từ Excel, bảng dán từ Google Sheet, JSON app tự xuất, ghi chú chép tay.
//
// Module viết bằng TypeScript nên phải bundle trước khi chạy - đổi lại test chạy
// trên chính đoạn mã app dùng, không phải một bản chép tay dễ lệch.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let catalog;

before(async () => {
  const { build } = await import(`file:///${join(ROOT, 'node_modules/esbuild/lib/main.js').replace(/\\/g, '/')}`);
  const outfile = join(tmpdir(), `product-catalog-${process.pid}.mjs`);
  await build({
    entryPoints: [join(HERE, 'productCatalog.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'error',
  });
  catalog = await import(`file:///${outfile.replace(/\\/g, '/')}`);
});

// Bảng xuất từ Excel: mô tả có dấu phẩy, dòng cuối bỏ trống cột giá.
const CSV = [
  'Tên sản phẩm,Dòng sản phẩm,Dung tích,Công dụng,Giá',
  'Parasola Essence Aqua Gel,Chống nắng,70g,"Chống nắng SPF50+ PA++++, dưỡng ẩm, kiềm dầu",250000',
  'Parasola Fragrance UV Spray,Chống nắng,90g,"Xịt chống nắng toả hương, kháng nước 80 phút",320000',
  'Naris Ailus Cleansing Oil,Tẩy trang,150ml,Làm sạch lớp trang điểm,',
].join('\n');

test('CSV: đọc đủ số dòng và tách đúng cột tên với dòng sản phẩm', () => {
  const items = catalog.parseProductFile(CSV, 'san-pham.csv');
  assert.equal(items.length, 3);
  assert.equal(items[0].name, 'Parasola Essence Aqua Gel');
  assert.equal(items[0].line, 'Chống nắng');
});

test('CSV: dấu phẩy trong ngoặc kép không làm vỡ bảng', () => {
  const [first] = catalog.parseProductFile(CSV, 'san-pham.csv');
  assert.match(first.details, /Chống nắng SPF50\+ PA\+{4}, dưỡng ẩm, kiềm dầu/);
  assert.match(first.details, /Giá: 250000/);
});

test('CSV: ô trống không sinh ra dòng mô tả rỗng', () => {
  const items = catalog.parseProductFile(CSV, 'san-pham.csv');
  assert.ok(!/Giá:/.test(items[2].details), `mô tả còn cột rỗng: ${items[2].details}`);
});

test('CSV: nhận cột tên viết không dấu', () => {
  const [p] = catalog.parseProductFile('Ten san pham,Cong dung\nSản phẩm A,Dưỡng ẩm', 'a.csv');
  assert.equal(p.name, 'Sản phẩm A');
});

test('Bảng dán từ Google Sheet tách theo tab', () => {
  const [p] = catalog.parseProductFile('Tên\tCông dụng\nSản phẩm B\tLàm sạch sâu', 'dan-tu-sheet.txt');
  assert.equal(p.name, 'Sản phẩm B');
  assert.match(p.details, /Làm sạch sâu/);
});

test('CSV lưu bằng dấu chấm phẩy vẫn đọc được', () => {
  const [p] = catalog.parseProductFile('Tên sản phẩm;Công dụng\nSản phẩm C;Chống lão hoá', 'c.csv');
  assert.equal(p.name, 'Sản phẩm C');
});

test('JSON app tự xuất thì nhập lại giữ nguyên id', () => {
  const json = JSON.stringify([{ id: 'sp_1', name: 'Sản phẩm D', line: 'Trang điểm', details: 'Son lì lâu trôi' }]);
  const [p] = catalog.parseProductFile(json, 'danh-muc.json');
  assert.equal(p.id, 'sp_1');
  assert.equal(p.name, 'Sản phẩm D');
});

test('Ghi chú chép tay: mỗi khối một sản phẩm, bỏ dấu markdown khỏi tên', () => {
  const items = catalog.parseProductFile('Sản phẩm E\nDưỡng da ban đêm\n\n# Sản phẩm F\nKem chống nắng', 'ghi-chu.md');
  assert.equal(items.length, 2);
  assert.equal(items[1].name, 'Sản phẩm F');
});

test('Tải lại đúng file cũ thì cập nhật chứ không nhân đôi danh mục', () => {
  const current = catalog.parseProductFile(CSV, 'a.csv');
  const merged = catalog.mergeProducts(current, catalog.parseProductFile(CSV, 'a.csv'));
  assert.equal(merged.length, 3);
  // Giữ id cũ, nếu không thì các sản phẩm đang chọn dở sẽ mất khi nhập lại.
  assert.equal(merged[0].id, current[0].id);
});

test('Brand chưa có sản phẩm thì không chèn gì vào prompt', () => {
  assert.equal(catalog.formatProductsForPrompt({ name: 'X' }), '');
});

test('Prompt mang tên, chi tiết và luật cấm bịa thông số', () => {
  const text = catalog.formatProductsForPrompt({ name: 'Naris', products: catalog.parseProductFile(CSV, 'a.csv') });
  assert.match(text, /Parasola Essence Aqua Gel/);
  assert.match(text, /3 sản phẩm/);
  assert.match(text, /KHÔNG bịa thêm sản phẩm/);
});

test('Chọn sản phẩm: prompt chỉ còn sản phẩm đã chọn, danh mục gốc không đổi', () => {
  const products = catalog.parseProductFile(CSV, 'a.csv');
  const brand = { name: 'Naris', products };
  const picked = catalog.brandWithSelectedProducts(brand, [products[1].id]);
  assert.equal(picked.products.length, 1);
  assert.equal(picked.products[0].name, 'Parasola Fragrance UV Spray');
  assert.equal(brand.products.length, 3, 'không được sửa vào brand gốc');
});

test('Không chọn sản phẩm nào thì giữ nguyên cả danh mục', () => {
  const products = catalog.parseProductFile(CSV, 'a.csv');
  assert.equal(catalog.brandWithSelectedProducts({ name: 'Naris', products }, []).products.length, 3);
});

test('File rỗng báo lỗi thay vì trả danh mục rỗng im lặng', () => {
  assert.throws(() => catalog.parseProductFile('   ', 'x.csv'), /rỗng/);
});

test('splitCsvLine giữ đúng ngoặc kép lồng nhau', () => {
  assert.deepEqual(catalog.splitCsvLine('a,"b ""x"" c",d', ','), ['a', 'b "x" c', 'd']);
});
