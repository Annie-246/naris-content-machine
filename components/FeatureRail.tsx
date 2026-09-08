import React, { useEffect, useMemo, useState } from 'react';
import { Search, ArrowRight, CheckCircle2, Video, FileText } from 'lucide-react';
import { AnalysisMode } from '../types';
import { VIDEO_FEATURES, ARTICLE_FEATURES, FeatureTab, getFeature } from '../data/features';
import { CollapseButton, ResizeHandle, type PanelState } from './PanelChrome';

// The feature library, kept beside the workspace so switching tools never costs
// a trip back to the launcher screen.
export const FeatureRail: React.FC<{
  activeMode: AnalysisMode;
  onSelect: (mode: AnalysisMode) => void;
  /** Bề rộng và trạng thái thu gọn của thanh. */
  panel: PanelState;
}> = ({ activeMode, onSelect, panel }) => {
  const [tab, setTab] = useState<FeatureTab>(getFeature(activeMode).tab);
  const [query, setQuery] = useState('');

  // Following the workspace keeps the list on the right shelf when the user
  // jumps to a feature from somewhere else.
  useEffect(() => {
    setTab(getFeature(activeMode).tab);
  }, [activeMode]);

  const features = tab === 'video' ? VIDEO_FEATURES : ARTICLE_FEATURES;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => (f.title + ' ' + f.desc).toLowerCase().includes(q));
  }, [features, query]);

  const compact = panel.collapsed;

  // Thu gọn: chỉ còn một dải icon. Vẫn đủ để nhảy giữa các tính năng mà không
  // phải mở lại thanh, nên nó là chế độ dùng được chứ không phải chỗ cất tạm.
  if (compact) {
    return (
      <aside className="hidden md:flex w-[68px] shrink-0 border-l border-slate-200 bg-white h-[calc(100vh-73px)] sticky top-[73px] flex-col items-center py-4 gap-2 overflow-y-auto custom-scrollbar">
        <CollapseButton collapsed onClick={panel.toggle} side="right" />
        <div className="w-8 border-t border-slate-200 my-1" />
        {[...VIDEO_FEATURES, ...ARTICLE_FEATURES].map((feature) => {
          const Icon = feature.icon;
          const active = feature.mode === activeMode;
          return (
            <button
              key={feature.mode}
              onClick={() => onSelect(feature.mode)}
              title={feature.title}
              aria-label={feature.title}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors border
                ${active
                  ? 'bg-[#fdf2f8] border-[#DB2777]'
                  : 'bg-white border-transparent hover:bg-[#FDF2F8]'}`}
            >
              <Icon className="w-[21px] h-[21px] text-[#DB2777]" strokeWidth={1.75} />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside
      style={{ ['--rail-w' as string]: `${panel.width}px` }}
      className={`hidden md:block relative w-[320px] lg:w-[var(--rail-w)] shrink-0 border-l border-slate-200 bg-white
        h-[calc(100vh-73px)] sticky top-[73px]
        ${panel.dragging ? '' : 'lg:transition-[width] lg:duration-150'}`}
    >
      <ResizeHandle
        side="right"
        dragging={panel.dragging}
        onPointerDown={panel.startResize}
        onDoubleClick={panel.resetWidth}
        label="Đổi rộng thanh tính năng"
      />

      <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-slate-500">Thư viện tính năng</p>
          <CollapseButton collapsed={false} onClick={panel.toggle} side="right" className="hidden lg:inline-flex -mr-1" />
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-50 border border-slate-200">
          {([['video', 'Video', Video], ['article', 'Bài viết', FileText]] as const).map(([id, label, Icon]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                  ${active ? 'bg-white border border-[#DB2777] text-[#DB2777] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#DB2777]' : 'text-slate-400'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tính năng..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#DB2777] transition-colors"
          />
        </div>

        <div>
          <p className="text-[13px] font-semibold text-slate-500 mb-3">Content Creator</p>
          <div className="space-y-2.5">
            {filtered.map((feature) => {
              const Icon = feature.icon;
              const active = feature.mode === activeMode;
              return (
                <button
                  key={feature.mode}
                  onClick={() => onSelect(feature.mode)}
                  className={`group w-full text-left rounded-2xl border p-3.5 transition-all flex gap-3
                    ${active
                      ? 'border-[#DB2777] bg-[#fdf2f8] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-[#fbcfe8] hover:shadow-sm'}`}
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                      ${active ? 'bg-white border border-[#fbcfe8]' : 'bg-[#FDF2F8]'}`}
                  >
                    <Icon className="w-5 h-5 text-[#DB2777]" strokeWidth={1.75} />
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-slate-900 leading-tight">{feature.title}</span>
                      {feature.soon && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Sắp có
                        </span>
                      )}
                    </span>
                    <span className="block text-[13px] text-slate-600 leading-snug mt-1">{feature.desc}</span>
                  </span>

                  <span className="shrink-0 self-center">
                    {active ? (
                      <CheckCircle2 className="w-5 h-5 text-[#DB2777]" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#DB2777] transition-colors" />
                    )}
                  </span>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                Không có tính năng nào khớp "{query}".
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </aside>
  );
};
