import { BrandProduct, BrandProfile } from '../types';
import { createProductId } from '../data/brandPresets';

// Danh mục sản phẩm của thương hiệu.
//
// Một hãng mỹ phẩm có hàng chục mã hàng, mỗi mã một công dụng, một bộ thành phần
// và một mức giá riêng. Nếu prompt chỉ có mô tả chung của thương hiệu thì bài
// viết ra hoặc chung chung, hoặc tệ hơn là bịa thông số - thứ không được phép
// xảy ra với ngành mỹ phẩm. Vì vậy danh mục nằm ngay trong Brand DNA, và mỗi lần
// chạy người dùng chọn đúng sản phẩm cần nói.
//
// File người dùng có sẵn thường là bảng xuất từ Excel hoặc Google Sheet, nên
// đọc thẳng CSV/TSV là đường ngắn nhất; JSON dành cho lần xuất - nhập lại giữa
// hai máy; còn text thuần cho người chép tay từ tài liệu nội bộ.

/** Số ký tự tối đa của một mô tả trước khi cắt bớt, để một dòng dán nhầm cả trang web không nuốt hết prompt. */
const MAX_DETAILS = 2000;

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();

const trimDetails = (s: string): string => {
  const t = s.trim();
  return t.length > MAX_DETAILS ? `${t.slice(0, MAX_DETAILS)}…` : t;
};

/**
 * Tách một dòng CSV, tôn trọng dấu ngoặc kép.
 *
 * Mô tả sản phẩm hay có dấu phẩy ("dưỡng ẩm, chống nắng, nâng tông"), nên cắt
 * thô theo dấu phẩy sẽ vỡ bảng ngay dòng đầu tiên.
 */
export const splitCsvLine = (line: string, sep: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
};

/** Tên cột nào là tên sản phẩm, cột nào là dòng sản phẩm. Phần còn lại thành mô tả. */
const NAME_HINTS = ['ten san pham', 'ten', 'san pham', 'name', 'product', 'product name', 'title', 'ma san pham', 'sku'];
const LINE_HINTS = ['dong san pham', 'dong', 'nhom', 'line', 'category', 'danh muc', 'loai'];

const deaccent = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();

const pickColumn = (headers: string[], hints: string[]): number => {
  const norm = headers.map(deaccent);
  for (const hint of hints) {
    const exact = norm.indexOf(hint);
    if (exact !== -1) return exact;
  }
  for (let i = 0; i < norm.length; i++) {
    if (hints.some((h) => norm[i].includes(h))) return i;
  }
  return -1;
};

/** Bảng CSV / TSV xuất từ Excel hay Google Sheet. */
const parseTable = (text: string, sep: string): BrandProduct[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0], sep);
  const nameIdx = pickColumn(headers, NAME_HINTS);
  const lineIdx = pickColumn(headers, LINE_HINTS);
  // Không nhận ra cột tên thì coi cột đầu là tên - bảng nào cũng mở đầu bằng tên.
  const nameCol = nameIdx === -1 ? 0 : nameIdx;

  const products: BrandProduct[] = [];
  for (const raw of lines.slice(1)) {
    const cells = splitCsvLine(raw, sep);
    const name = clean(cells[nameCol] || '');
    if (!name) continue;

    // Mọi cột còn lại vào mô tả, kèm tên cột để AI biết con số nào là gì.
    const details = cells
      .map((cell, i) => {
        if (i === nameCol || i === lineIdx || !cell.trim()) return '';
        const label = headers[i]?.trim();
        return label ? `${label}: ${cell.trim()}` : cell.trim();
      })
      .filter(Boolean)
      .join('\n');

    products.push({
      id: createProductId(),
      name,
      line: lineIdx === -1 ? '' : clean(cells[lineIdx] || ''),
      details: trimDetails(details),
    });
  }
  return products;
};

/** File JSON đã xuất từ chính app này, hoặc mảng object bất kỳ có trường name. */
const parseJson = (text: string): BrandProduct[] => {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.products)
      ? parsed.products
      : null;
  if (!list) throw new Error('File JSON không chứa danh sách sản phẩm.');

  const products: BrandProduct[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const src = item as Record<string, unknown>;
    const str = (k: string): string => (typeof src[k] === 'string' ? (src[k] as string).trim() : '');
    const name = str('name') || str('ten') || str('title');
    if (!name) continue;

    // Trường lạ vẫn giữ lại: người dùng xuất từ hệ thống khác thì cột nào cũng có thể là thông tin thật.
    const known = new Set(['id', 'name', 'ten', 'title', 'line', 'details', 'dong']);
    const extra = Object.entries(src)
      .filter(([k, v]) => !known.has(k) && (typeof v === 'string' || typeof v === 'number'))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const details = [str('details'), extra].filter(Boolean).join('\n');
    products.push({
      id: str('id') || createProductId(),
      name,
      line: str('line') || str('dong'),
      details: trimDetails(details),
    });
  }
  return products;
};

/**
 * Text thuần: mỗi sản phẩm là một khối, cách nhau bằng dòng trống, dòng đầu là tên.
 * Đây là cách người ta chép từ tài liệu nội bộ ra nhanh nhất.
 */
const parseBlocks = (text: string): BrandProduct[] =>
  text
    .split(/\n\s*\n/)
    .map((block) => block.split(/\r?\n/).filter((l) => l.trim()))
    .filter((lines) => lines.length > 0)
    .map((lines) => ({
      id: createProductId(),
      // Dòng tiêu đề hay có dấu gạch đầu dòng hoặc "#" của markdown.
      name: clean(lines[0].replace(/^[#>\-*\d.)\s]+/, '')),
      line: '',
      details: trimDetails(lines.slice(1).join('\n')),
    }))
    .filter((p) => p.name);

/**
 * Đọc file danh mục người dùng tải lên.
 *
 * Không đoán định dạng bằng phần mở rộng thôi: file .txt xuất từ Excel vẫn là
 * bảng tab, còn .csv người ta lưu bằng dấu chấm phẩy khá thường xuyên.
 */
export const parseProductFile = (text: string, fileName = ''): BrandProduct[] => {
  const body = text.replace(/^\uFEFF/, '').trim();
  if (!body) throw new Error('File rỗng.');

  if (/\.json$/i.test(fileName) || body.startsWith('[') || body.startsWith('{')) {
    return parseJson(body);
  }

  const firstLine = body.split(/\r?\n/)[0] || '';
  const sep = firstLine.includes('\t') ? '\t'
    : (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ';'
      : firstLine.includes(',') ? ',' : '';

  const products = sep ? parseTable(body, sep) : parseBlocks(body);
  if (!products.length) throw new Error('Không đọc được sản phẩm nào trong file.');
  return products;
};

/** Ghép danh mục mới vào danh mục cũ, trùng tên thì bản mới đè lên. */
export const mergeProducts = (current: BrandProduct[], incoming: BrandProduct[]): BrandProduct[] => {
  const byName = new Map(current.map((p) => [deaccent(p.name), p]));
  for (const p of incoming) {
    const key = deaccent(p.name);
    const old = byName.get(key);
    byName.set(key, old ? { ...p, id: old.id } : p);
  }
  return [...byName.values()];
};

/**
 * Khối sản phẩm đưa vào prompt.
 *
 * Chọn sẵn sản phẩm nào thì chỉ sản phẩm đó vào đây kèm đầy đủ chi tiết; nếu
 * không chọn gì thì chỉ liệt kê tên, đủ để AI biết thương hiệu có những gì mà
 * không nuốt mất chỗ của nội dung gốc.
 */
export const formatProductsForPrompt = (brand?: BrandProfile): string => {
  const products = brand?.products || [];
  if (!products.length) return '';

  const detailed = products.filter((p) => p.details.trim());
  const body = products
    .map((p, i) => {
      const head = p.line ? `${i + 1}. ${p.name} (dòng: ${p.line})` : `${i + 1}. ${p.name}`;
      return p.details.trim() ? `${head}\n${p.details.trim()}` : head;
    })
    .join('\n\n');

  return `
  =======================================================
  🧴 DANH MỤC SẢN PHẨM CỦA THƯƠNG HIỆU (${products.length} sản phẩm${detailed.length ? '' : ' - chỉ có tên'})
  =======================================================
${body}
  -------------------------------------------------------
  QUY TẮC BẮT BUỘC KHI NHẮC SẢN PHẨM:
  - Chỉ được nhắc tên, công dụng, thành phần, quy cách và giá ĐÚNG NHƯ danh mục trên.
  - TUYỆT ĐỐI KHÔNG bịa thêm sản phẩm, công dụng, thành phần hay chỉ số không có trong danh mục.
  - Thiếu thông tin nào thì viết vòng qua, không tự suy đoán con số.
  - Không gán công dụng của sản phẩm này sang sản phẩm khác.
  =======================================================
  `;
};

/** Brand dùng cho một lần chạy: chỉ giữ lại các sản phẩm người dùng đã chọn. */
export const brandWithSelectedProducts = (
  brand: BrandProfile,
  selectedIds: string[],
): BrandProfile => {
  const products = brand.products || [];
  if (!products.length || !selectedIds.length) return brand;
  return { ...brand, products: products.filter((p) => selectedIds.includes(p.id)) };
};
