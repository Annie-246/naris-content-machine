import { BrandProduct } from '../types';
import { createProductId } from '../data/brandPresets';
import { fileToBase64 } from './brandLearnService';
import { getGeminiApiKey } from './apiKeyStore';
import { postJson } from './apiClient';

// Đọc danh mục sản phẩm từ tài liệu thật.
//
// Bảng CSV là trường hợp đẹp, nhưng phần lớn hãng mỹ phẩm giữ danh mục dưới dạng
// catalogue PDF, bảng giá xuất từ Word, hay ảnh chụp trang sản phẩm. Bắt người
// dùng gõ lại bốn chục mã hàng vào form là việc vô nghĩa khi model đọc thẳng
// được những tài liệu đó.
//
// Chỉ Gemini đọc được PDF và ảnh trong app này, nên đường đi luôn là /api/gemini
// bất kể người dùng phân công nhà cung cấp nào cho phần văn bản.

/** Tài liệu phải nhờ model đọc, khác với bảng biểu tự phân tích được. */
export const AI_READABLE = /\.(pdf|png|jpe?g|webp|gif|heic)$/i;

/** Gemini nhận file tới 20MB qua inline data; giữ ngưỡng thấp hơn cho chắc. */
const MAX_BYTES = 15 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
};

const SYSTEM_INSTRUCTION = `Bạn là trợ lý dữ liệu, chuyên rút danh mục sản phẩm từ tài liệu của thương hiệu.

Nguyên tắc bắt buộc:
- CHỈ lấy thông tin có thật trong tài liệu. TUYỆT ĐỐI không suy đoán, không bổ sung kiến thức bên ngoài.
- Thiếu thông tin nào thì bỏ trống, không tự điền. Sai một chỉ số thành phần hay chỉ số chống nắng là lỗi nghiêm trọng.
- Mỗi sản phẩm là một mục riêng. Cùng một dòng sản phẩm nhưng khác dung tích, khác tông màu, khác mã thì tách thành các mục riêng.
- Giữ nguyên tên sản phẩm như tài liệu viết, kể cả phần tiếng Anh và ký hiệu. Không dịch, không rút gọn.
- Bỏ qua phần dẫn nhập, lời quảng cáo chung, thông tin liên hệ, mục lục và trang bìa.

Trả về JSON đúng dạng sau, không kèm giải thích:
{"products":[{"name":"tên sản phẩm","line":"dòng sản phẩm nếu tài liệu có ghi, không thì để rỗng","details":"công dụng, thành phần chính, dung tích/quy cách, giá, đối tượng phù hợp, cách dùng - mỗi ý một dòng, chỉ ghi thứ tài liệu nói"}]}`;

const PROMPT = `Đọc tài liệu đính kèm và rút ra toàn bộ danh mục sản phẩm trong đó.

Với mỗi sản phẩm, gom mọi chi tiết tài liệu có nói: công dụng, thành phần chính, dung tích hoặc quy cách, giá, đối tượng phù hợp, cách dùng, điểm khác biệt.

Nếu tài liệu không phải danh mục sản phẩm, trả về {"products":[]}.`;

/**
 * Bóc lấy phần JSON trong câu trả lời của model.
 *
 * Đã xin JSON thuần mà model vẫn có lúc bọc markdown, và tệ hơn là có lúc chỉ
 * thêm dấu ``` đóng ở cuối chứ không mở - bắt cặp fence kiểu gì cũng trượt.
 * Cắt theo dấu ngoặc ngoài cùng thì đúng trong cả ba trường hợp.
 */
export const extractJson = (raw: string): string => {
  let t = raw.trim();
  // Bỏ mọi dấu rào markdown ở hai đầu, có bao nhiêu bỏ bấy nhiêu.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const firstObj = t.indexOf('{');
  const firstArr = t.indexOf('[');
  const start = firstArr !== -1 && (firstObj === -1 || firstArr < firstObj) ? firstArr : firstObj;
  if (start === -1) return t;

  const end = t[start] === '[' ? t.lastIndexOf(']') : t.lastIndexOf('}');
  return end > start ? t.slice(start, end + 1) : t.slice(start);
};

const mimeOf = (file: File): string => {
  if (file.type) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/pdf';
};

/**
 * Nhờ model đọc một tài liệu rồi trả về danh mục sản phẩm.
 *
 * Kết quả vẫn hiện ra để người dùng soát và sửa trước khi lưu - model đọc bảng
 * trong PDF khá tốt nhưng không hoàn hảo, mà đây là dữ liệu sẽ đi thẳng vào mọi
 * bài viết sau này.
 */
export const extractProductsFromFile = async (file: File): Promise<BrandProduct[]> => {
  if (file.size > MAX_BYTES) {
    throw new Error(`File nặng ${Math.round(file.size / 1024 / 1024)}MB, vượt giới hạn 15MB. Hãy tách nhỏ tài liệu rồi tải từng phần.`);
  }

  const base64 = await fileToBase64(file);
  if (!base64) throw new Error('Không đọc được nội dung file.');

  const payload = await postJson<{ text: string }>('/api/gemini', {
    apiKey: getGeminiApiKey(),
    parts: [
      { inlineData: { data: base64, mimeType: mimeOf(file) } },
      { text: PROMPT },
    ],
    systemInstruction: SYSTEM_INSTRUCTION,
    // Danh mục là dữ liệu, không phải sáng tác: hạ nhiệt độ xuống sát 0.
    temperature: 0.1,
    responseJson: true,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(payload.text || ''));
  } catch {
    throw new Error('AI trả về dữ liệu không đọc được. Thử lại, hoặc lưu tài liệu thành .csv rồi tải lên.');
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { products?: unknown })?.products)
      ? (parsed as { products: unknown[] }).products
      : [];

  const products: BrandProduct[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const src = item as Record<string, unknown>;
    const str = (k: string): string => (typeof src[k] === 'string' ? (src[k] as string).trim() : '');
    const name = str('name');
    if (!name) continue;
    products.push({
      id: createProductId(),
      name,
      line: str('line'),
      details: str('details'),
    });
  }

  if (!products.length) {
    throw new Error('Không tìm thấy sản phẩm nào trong tài liệu này. Kiểm tra lại xem file có đúng là danh mục sản phẩm không.');
  }
  return products;
};
