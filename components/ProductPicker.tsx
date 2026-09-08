import React, { useMemo, useState } from 'react';
import { Package, Search, Check, X } from 'lucide-react';
import { BrandProduct } from '../types';

/**
 * Chọn sản phẩm cho một lần chạy.
 *
 * Cả danh mục đổ vào prompt thì vừa tốn chỗ vừa loãng: model đọc bốn chục mã
 * hàng rồi viết một bài nhắc chung chung cả bốn chục. Chọn đúng cái đang cần nói
 * thì nó có đủ thành phần, quy cách và công dụng của riêng sản phẩm đó.
 *
 * Không chọn gì cũng hợp lệ - khi đó AI chỉ nhận danh sách tên để biết thương
 * hiệu có những gì, đủ để không bịa ra sản phẩm không tồn tại.
 */
export const ProductPicker: React.FC<{
  products: BrandProduct[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}> = ({ products, selectedIds, onChange }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.line || '').toLowerCase().includes(q),
    );
  }, [products, query]);

  if (!products.length) return null;

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5 text-[#DB2777]" /> Sản phẩm nhắc tới trong bài (tùy chọn)
        {selectedIds.length > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
            đã chọn {selectedIds.length}
          </span>
        )}
      </label>

      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Tìm trong ${products.length} sản phẩm...`}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#DB2777]"
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3 h-3" /> Bỏ chọn
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
          {filtered.map((p) => {
            const on = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                title={p.details ? p.details.slice(0, 200) : undefined}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 max-w-full
                  ${on
                    ? 'bg-[#DB2777] text-white border-[#BE185D] font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50'}`}
              >
                {on && <Check className="w-3 h-3 shrink-0" />}
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-500 py-1">Không có sản phẩm nào khớp.</p>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          {selectedIds.length
            ? 'AI sẽ bám đúng chi tiết của các sản phẩm đã chọn, không bịa thêm thông số.'
            : 'Chưa chọn gì thì AI chỉ biết danh sách tên sản phẩm, không có chi tiết từng mã.'}
        </p>
      </div>
    </div>
  );
};
