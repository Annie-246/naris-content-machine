import React, { useMemo, useRef, useState } from 'react';
import {
  Package, Upload, Plus, Trash2, Download, Search, ChevronDown, ChevronUp, AlertCircle, Check,
} from 'lucide-react';
import { BrandProduct } from '../types';
import { createProductId } from '../data/brandPresets';
import { mergeProducts, parseProductFile } from '../services/productCatalog';

/**
 * Danh mục sản phẩm của một thương hiệu, nằm trong hộp thoại Brand DNA.
 *
 * Nhập bằng file là đường chính: không ai ngồi gõ tay bốn chục mã hàng vào form,
 * mà bảng sản phẩm thì hãng nào cũng có sẵn dưới dạng Excel hay Google Sheet.
 * Thêm tay chỉ để vá lại vài dòng sau khi nhập.
 */
export const ProductCatalogPanel: React.FC<{
  products: BrandProduct[];
  onChange: (products: BrandProduct[]) => void;
}> = ({ products, onChange }) => {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.line || '').toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q),
    );
  }, [products, query]);

  const handleFile = async (file: File) => {
    setError('');
    setNotice('');
    try {
      const parsed = parseProductFile(await file.text(), file.name);
      const merged = mergeProducts(products, parsed);
      onChange(merged);
      const added = merged.length - products.length;
      setNotice(
        `Đã đọc ${parsed.length} sản phẩm từ ${file.name}` +
          (added < parsed.length ? ` (${parsed.length - added} sản phẩm trùng tên đã được cập nhật).` : '.'),
      );
    } catch (e: any) {
      setError(
        `${e?.message || 'Không đọc được file.'} ` +
          'Hỗ trợ file .csv, .tsv, .txt, .json xuất từ Excel hoặc Google Sheet - dòng đầu là tên cột, ' +
          'cần có cột tên sản phẩm.',
      );
    }
  };

  const update = (id: string, patch: Partial<BrandProduct>) =>
    onChange(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const handleAdd = () => {
    const fresh: BrandProduct = { id: createProductId(), name: '', line: '', details: '' };
    onChange([...products, fresh]);
    setOpenId(fresh.id);
    setQuery('');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'danh-muc-san-pham.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-pink-300 bg-pink-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-pink-600" /> 14. Danh Mục Sản Phẩm
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-300 normal-case tracking-normal">
              {products.length} sản phẩm
            </span>
          </p>
          <p className="text-[11px] text-slate-600 mt-1 max-w-2xl">
            Tải lên bảng sản phẩm để AI viết đúng tên, công dụng và thông số của từng mã hàng thay vì
            nói chung chung. Mỗi lần chạy bạn chọn sản phẩm cần nói tới.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.md,text/csv,text/plain,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" /> Tải file danh mục
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="text-xs font-semibold text-slate-700 bg-white border border-pink-200 hover:bg-pink-50 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm tay
          </button>
          {products.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              title="Xuất danh mục ra file JSON"
              className="text-xs font-semibold text-slate-700 bg-white border border-pink-200 hover:bg-pink-50 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Xuất
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {error}
        </p>
      )}
      {notice && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-px" /> {notice}
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-xs text-slate-500 bg-white border border-dashed border-pink-200 rounded-lg px-3 py-4 text-center">
          Chưa có sản phẩm nào. Tải lên file .csv / .xlsx đã lưu thành .csv, hoặc bấm “Thêm tay”.
        </p>
      ) : (
        <>
          {products.length > 6 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm trong danh mục..."
                className="w-full bg-white border border-pink-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filtered.map((p) => {
              const open = openId === p.id;
              return (
                <div key={p.id} className="bg-white border border-pink-200 rounded-lg">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : p.id)}
                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                    >
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {p.name || <span className="text-slate-400 italic">Chưa đặt tên</span>}
                      </span>
                      {p.line && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 shrink-0">
                          {p.line}
                        </span>
                      )}
                      {!p.details.trim() && (
                        <span className="text-[10px] text-amber-700 shrink-0">chưa có mô tả</span>
                      )}
                      {open ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(products.filter((x) => x.id !== p.id))}
                      title="Xoá sản phẩm"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {open && (
                    <div className="px-3 pb-3 space-y-2 border-t border-pink-100 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => update(p.id, { name: e.target.value })}
                          placeholder="Tên sản phẩm"
                          className="w-full bg-pink-50/40 border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                        />
                        <input
                          type="text"
                          value={p.line || ''}
                          onChange={(e) => update(p.id, { line: e.target.value })}
                          placeholder="Dòng sản phẩm (tuỳ chọn)"
                          className="w-full bg-pink-50/40 border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <textarea
                        rows={5}
                        value={p.details}
                        onChange={(e) => update(p.id, { details: e.target.value })}
                        placeholder="Công dụng, thành phần chính, quy cách, giá, đối tượng phù hợp, điểm khác biệt so với các sản phẩm khác..."
                        className="w-full bg-pink-50/40 border border-pink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 resize-y font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-3">Không có sản phẩm nào khớp.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
