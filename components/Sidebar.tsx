import React from 'react';
import { Home, LayoutGrid, Fingerprint, Puzzle, ChevronDown, Radar, Waves, History, X } from 'lucide-react';
import { NarisLogo } from './NarisLogo';
import { APP_CONFIG } from '../data/appConfig';
import { CollapseButton, ResizeHandle, type PanelState } from './PanelChrome';

export type SidebarView = 'overview' | 'radar' | 'waterfall' | 'features' | 'history' | 'brand-dna' | 'integrations';

interface NavItem {
  id: SidebarView;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: Home },
  { id: 'radar', label: 'Content Radar', icon: Radar },
  { id: 'waterfall', label: 'Content Waterfall', icon: Waves },
  { id: 'features', label: 'Content Creator', icon: LayoutGrid },
  { id: 'history', label: 'Lịch sử nội dung', icon: History },
];

const SETTINGS_NAV: NavItem[] = [
  { id: 'brand-dna', label: 'Brand DNA', icon: Fingerprint },
  { id: 'integrations', label: 'Tích hợp', icon: Puzzle },
];

const NavButton: React.FC<{
  item: NavItem;
  active: boolean;
  compact: boolean;
  onClick: () => void;
}> = ({ item, active, compact, onClick }) => {
  const Icon = item.icon;

  // Thu gọn thì nhãn biến mất, nên tên mục chuyển vào tooltip - bằng không người
  // dùng phải đoán ý nghĩa của sáu cái icon giống nhau.
  return (
    <button
      onClick={onClick}
      title={compact ? item.label : undefined}
      aria-label={item.label}
      className={`relative w-full flex items-center transition-colors rounded-r-2xl
        ${compact ? 'justify-center px-0 py-3' : 'gap-4 pl-8 pr-4 py-3.5 text-left'}
        ${active ? 'bg-[#FBE7F0] text-[#A4145E] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[5px] rounded-r-full bg-[#A4145E]" />}
      <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#A4145E]' : 'text-slate-400'}`} />
      {!compact && (
        <>
          <span className="text-[15px] truncate">{item.label}</span>
          {item.soon && (
            <span className="ml-auto text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              Sắp có
            </span>
          )}
        </>
      )}
    </button>
  );
};

export const Sidebar = ({
  activeView,
  onNavigate,
  teamName = APP_CONFIG.name,
  teamRole = APP_CONFIG.teamRole,
  isMobileOpen = false,
  onCloseMobile,
  panel,
}: {
  activeView: SidebarView;
  onNavigate: (view: SidebarView) => void;
  teamName?: string;
  teamRole?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  /** Bề rộng và trạng thái thu gọn; chỉ áp dụng từ màn hình lớn trở lên. */
  panel: PanelState;
}) => {
  // Ngăn kéo trên màn hẹp luôn mở hết cỡ: thu gọn chỉ có nghĩa khi thanh nằm
  // cạnh nội dung, còn ở đây nó phủ lên trên nội dung.
  const compact = panel.collapsed;

  return (
    <>
    {/* Màn hình hẹp: nền mờ phía sau ngăn kéo, chạm vào là đóng. */}
    {isMobileOpen && (
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        onClick={onCloseMobile}
        aria-hidden
      />
    )}

    {/* Màn rộng phải trả lại left/bottom: sticky mà vẫn giữ left-0 sẽ dính cả
        theo chiều ngang, nên chỉ cần trang lỡ tràn ngang là thanh bên đứng im
        đè lên nội dung đang cuộn bên dưới. */}
    <aside
      style={{ ['--sidebar-w' as string]: `${compact ? 76 : panel.width}px` }}
      className={`w-[300px] lg:w-[var(--sidebar-w)] shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen
        fixed inset-y-0 left-0 z-50 transition-transform duration-200
        lg:sticky lg:top-0 lg:bottom-auto lg:left-auto lg:z-auto lg:translate-x-0 lg:relative
        ${panel.dragging ? '' : 'lg:transition-[width] lg:duration-150'}
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
    >
      <div className={`border-b border-slate-200 flex items-center gap-2 ${compact ? 'px-3 py-5 justify-center' : 'px-6 py-6 justify-between'}`}>
        {compact ? (
          <button
            onClick={panel.toggle}
            title="Mở rộng thanh bên"
            aria-label="Mở rộng thanh bên"
            className="rounded-xl hover:opacity-80 transition-opacity"
          >
            <NarisLogo variant="compact" />
          </button>
        ) : (
          <>
            <NarisLogo className="min-w-0" />
            <div className="flex items-center shrink-0">
              <CollapseButton collapsed={false} onClick={panel.toggle} side="left" className="hidden lg:inline-flex" />
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar ${compact ? 'px-2' : 'pr-4'}`}>
        {!compact && <p className="px-8 pb-3 text-[15px] text-slate-500 truncate">{APP_CONFIG.workspaceLabel}</p>}
        <div className="space-y-1">
          {MAIN_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              compact={compact}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>

        <div className={`my-6 border-t border-slate-200 ${compact ? 'mx-2' : 'mx-8'}`} />

        {!compact && (
          <p className="px-8 pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Thiết lập chung
          </p>
        )}
        <div className="space-y-1">
          {SETTINGS_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              compact={compact}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      </nav>

      <div className={`border-t border-slate-200 ${compact ? 'px-2 py-4' : 'px-6 py-5'}`}>
        <button
          className={`w-full flex items-center group ${compact ? 'justify-center' : 'gap-3 text-left'}`}
          title={compact ? `${teamName} · ${teamRole}` : undefined}
        >
          <span className="w-10 h-10 rounded-full bg-[#A4145E] text-white flex items-center justify-center font-semibold shrink-0">
            {teamName.charAt(0).toUpperCase()}
          </span>
          {!compact && (
            <>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium text-slate-900 truncate">{teamName}</span>
                <span className="block text-xs text-slate-500 truncate">{teamRole}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
            </>
          )}
        </button>
      </div>

      {!compact && (
        <ResizeHandle
          side="left"
          dragging={panel.dragging}
          onPointerDown={panel.startResize}
          onDoubleClick={panel.resetWidth}
          label="Đổi rộng thanh bên trái"
        />
      )}
    </aside>
    </>
  );
};
