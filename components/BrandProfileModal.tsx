import React, { useState } from 'react';
import { X, Sparkles, Check, RotateCcw, Building2, MessageSquare, Volume2, ShieldAlert, Target, Lightbulb, Save, ChevronRight, BookOpen, Heart } from 'lucide-react';
import { BrandProfile } from '../types';
import { DEFAULT_BRAND_PRESETS } from '../data/brandPresets';

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand: BrandProfile;
  onSaveBrand: (updated: BrandProfile) => void;
  brandList: BrandProfile[];
  onSelectPreset: (brandId: string) => void;
}

export const BrandProfileModal: React.FC<BrandProfileModalProps> = ({
  isOpen,
  onClose,
  activeBrand,
  onSaveBrand,
  brandList,
  onSelectPreset
}) => {
  const [formData, setFormData] = useState<BrandProfile>({ ...activeBrand });
  const [savedAlert, setSavedAlert] = useState(false);

  // Sync state when activeBrand changes
  React.useEffect(() => {
    setFormData({ ...activeBrand });
  }, [activeBrand]);

  if (!isOpen) return null;

  const handleChange = (key: keyof BrandProfile, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBrand(formData);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 800);
  };

  const handleLoadPreset = (presetId: string) => {
    onSelectPreset(presetId);
    const selected = brandList.find(b => b.id === presetId) || DEFAULT_BRAND_PRESETS.find(b => b.id === presetId);
    if (selected) {
      setFormData({ ...selected });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-pink-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border-b border-pink-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-100 text-pink-700 rounded-xl border border-pink-300 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Bộ Quy Tắc Thương Hiệu (Brand DNA & Guidelines)
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-300">
                  AI sẽ áp dụng 100%
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Nạp giọng văn, quy tắc xưng hô, điểm cốt lõi và cấm kỵ để AI remake kịch bản chuẩn chất thương hiệu
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Quick Selector */}
        <div className="px-6 py-3 bg-pink-50/40 border-b border-pink-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-pink-600" /> Mẫu Thương Hiệu Có Sẵn:
          </span>
          {DEFAULT_BRAND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                formData.id === preset.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-400 shadow-sm font-semibold'
                  : 'bg-white text-slate-700 border-pink-200 hover:border-pink-400 hover:bg-pink-50'
              }`}
            >
              {formData.id === preset.id && <Check className="w-3 h-3 text-white" />}
              {preset.name.split(' - ')[0]}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên thương hiệu & Ngành hàng */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-pink-600" /> 1. Tên Thương Hiệu
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="VD: Parasola by Naris Up..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-pink-600" /> 2. Ngành Hàng & Lĩnh Vực
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="VD: Chống nắng & Chăm sóc da chuẩn Nhật..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* QUY TẮC XƯNG HÔ - HIGHLIGHTED */}
          <div className="p-4 bg-pink-50/70 border border-pink-300 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-pink-600" /> 3. Quy Tắc Xưng Hô Bắt Buộc (Addressing Convention)
              </label>
              <span className="text-[11px] text-pink-800 bg-pink-100 font-semibold px-2 py-0.5 rounded border border-pink-300">
                AI sẽ tuân thủ tuyệt đối
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-700 block font-semibold">Người nói / Chủ kênh xưng là:</span>
                <input
                  type="text"
                  required
                  value={formData.addressingSpeaker}
                  onChange={(e) => handleChange('addressingSpeaker', e.target.value)}
                  placeholder="VD: Parasola / Chúng mình / Em / Mình..."
                  className="w-full bg-white border border-pink-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-700 block font-semibold">Khán giả / Khách hàng gọi là:</span>
                <input
                  type="text"
                  required
                  value={formData.addressingAudience}
                  onChange={(e) => handleChange('addressingAudience', e.target.value)}
                  placeholder="VD: Nàng / Bạn / Team... / Chị yêu..."
                  className="w-full bg-white border border-pink-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* GIỌNG VĂN & HÌNH TƯỢNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-pink-600" /> 4. Giọng Văn & Sắc Thái (Tone of Voice)
              </label>
              <textarea
                rows={2}
                value={formData.brandVoiceTone}
                onChange={(e) => handleChange('brandVoiceTone', e.target.value)}
                placeholder="VD: Trẻ trung, nữ tính, tích cực, gần gũi, truyền cảm hứng..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" /> 5. Hình Tượng Người Nói (Speaker Persona)
              </label>
              <textarea
                rows={2}
                value={formData.speakerPersona}
                onChange={(e) => handleChange('speakerPersona', e.target.value)}
                placeholder="VD: Bạn thân am hiểu làm đẹp, trẻ trung, tinh tế, tích cực..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* KHÁCH HÀNG MỤC TIÊU & USPs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-pink-600" /> 6. Khách Hàng Mục Tiêu & Insight
              </label>
              <textarea
                rows={2}
                value={formData.targetAudience}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
                placeholder="VD: Nữ Gen Z & Millennials (18-35 tuổi) thích làn da rạng rỡ, trong trẻo..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-pink-600" /> 7. Điểm Cốt Lõi / Lợi Thế (USPs) & Sản Phẩm
              </label>
              <textarea
                rows={2}
                value={formData.coreUSPs}
                onChange={(e) => handleChange('coreUSPs', e.target.value)}
                placeholder="VD: SPF50+ PA++++, kháng nước 80p, 1 chạm 12h bảo vệ, thấm nhanh 15s..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* CTA & TỪ CẤM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-pink-600" /> 8. Lời Kêu Gọi Hành Động (CTA Mặc Định)
              </label>
              <input
                type="text"
                value={formData.callToAction}
                onChange={(e) => handleChange('callToAction', e.target.value)}
                placeholder="VD: Inbox ngay để được tư vấn chọn dòng chống nắng chuẩn da nàng nhé!"
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> 9. Điều Cấm Kỵ & Từ Ngữ Không Dùng
              </label>
              <input
                type="text"
                value={formData.forbiddenKeywords}
                onChange={(e) => handleChange('forbiddenKeywords', e.target.value)}
                placeholder="VD: Không tự suy diễn claim, không tạo áp lực ngoại hình, không xưng hô giật gân..."
                className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Slogan & Ghi chú thêm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                10. Slogan / Khẩu Hiệu (Nếu có)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="VD: Chống nắng chuẩn Nhật, tự tin tỏa sáng"
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                11. Ghi Chú Riêng Khác
              </label>
              <input
                type="text"
                value={formData.customNotes || ''}
                onChange={(e) => handleChange('customNotes', e.target.value)}
                placeholder="VD: Nhấn mạnh vào cảm giác mỏng nhẹ, hương thơm 3 tầng..."
                className="w-full bg-pink-50/40 border border-pink-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-pink-50/60 border-t border-pink-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleLoadPreset('parasola_naris')}
            className="text-xs text-pink-700 hover:text-pink-900 font-semibold flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Đặt Lại Parasola Mặc Định
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-pink-50 rounded-lg transition-colors border border-pink-200"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 rounded-lg shadow-sm flex items-center gap-2 transition-all border border-pink-400/40 active:scale-95"
            >
              {savedAlert ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" /> Đã Lưu Quy Tắc!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu & Áp Dụng Ngay
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


