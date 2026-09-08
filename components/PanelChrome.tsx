import React, { useCallback, useEffect, useRef, useState } from 'react';

// Hai thanh hai bên workspace - menu bên trái và thư viện tính năng bên phải -
// trước đây rộng cố định 300px và 380px. Trên laptop 1366px thì phần làm việc ở
// giữa chỉ còn khoảng 680px, chật đến mức bảng kết quả phải cuộn ngang.
//
// Nên cả hai thanh giờ kéo được bằng chuột và thu gọn được về dải icon. Kích
// thước người dùng chọn nằm trong localStorage, để lần mở sau vẫn đúng như vậy.

interface PanelOptions {
  /** Khoá localStorage, mỗi thanh một khoá riêng. */
  storageKey: string;
  min: number;
  max: number;
  initial: number;
  /** Thanh nằm bên nào của màn hình; quyết định chiều kéo. */
  side: 'left' | 'right';
  /** Màn hình hẹp hơn mức này thì mặc định thu gọn. */
  collapseBelow?: number;
}

export interface PanelState {
  width: number;
  collapsed: boolean;
  dragging: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
  startResize: (event: React.PointerEvent) => void;
  resetWidth: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readNumber = (key: string, fallback: number) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readFlag = (key: string, fallback: boolean) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === '1';
  } catch {
    return fallback;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* chế độ riêng tư của trình duyệt: chấp nhận quên kích thước */
  }
};

export const useResizablePanel = (options: PanelOptions): PanelState => {
  const { storageKey, min, max, initial, side, collapseBelow = 0 } = options;
  const widthKey = `${storageKey}:w`;
  const collapsedKey = `${storageKey}:c`;

  const [width, setWidth] = useState(() => clamp(readNumber(widthKey, initial), min, max));
  const [collapsed, setCollapsedState] = useState(() =>
    readFlag(collapsedKey, collapseBelow > 0 && typeof window !== 'undefined' && window.innerWidth < collapseBelow)
  );
  const [dragging, setDragging] = useState(false);
  const frame = useRef(0);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    write(collapsedKey, value ? '1' : '0');
  }, [collapsedKey]);

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  const resetWidth = useCallback(() => {
    setWidth(initial);
    write(widthKey, String(initial));
  }, [initial, widthKey]);

  const startResize = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    setDragging(true);

    const onMove = (moveEvent: PointerEvent) => {
      const delta = side === 'left' ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      const next = clamp(startWidth + delta, min, max);
      // Một khung hình một lần cập nhật: kéo thanh không nên kéo theo cả cây React.
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setWidth(next));
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      setWidth((current) => {
        write(widthKey, String(current));
        return current;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [max, min, side, width, widthKey]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { width, collapsed, dragging, toggle, setCollapsed, startResize, resetWidth };
};

/**
 * Mép kéo của một thanh. Rộng 10px cho dễ trúng nhưng chỉ vẽ một vạch mảnh, và
 * chỉ hiện rõ khi rê chuột vào hoặc đang kéo.
 */
export const ResizeHandle: React.FC<{
  side: 'left' | 'right';
  dragging: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onDoubleClick?: () => void;
  label: string;
}> = ({ side, dragging, onPointerDown, onDoubleClick, label }) => (
  <div
    role="separator"
    aria-orientation="vertical"
    aria-label={label}
    title={`${label} (kéo để đổi rộng, bấm đúp để về mặc định)`}
    onPointerDown={onPointerDown}
    onDoubleClick={onDoubleClick}
    className={`hidden lg:block absolute inset-y-0 ${side === 'left' ? '-right-[5px]' : '-left-[5px]'}
      w-[10px] z-30 cursor-col-resize group`}
  >
    <span
      className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full transition-colors
        ${dragging ? 'bg-[#A4145E]' : 'bg-transparent group-hover:bg-[#f0c9d8]'}`}
    />
  </div>
);

/** Nút thu gọn / mở lại, dùng chung cho cả hai thanh. */
export const CollapseButton: React.FC<{
  collapsed: boolean;
  onClick: () => void;
  /** Thanh nằm bên nào, để mũi tên chỉ đúng hướng. */
  side: 'left' | 'right';
  className?: string;
}> = ({ collapsed, onClick, side, className = '' }) => {
  // Mũi tên luôn chỉ về phía thanh sẽ chạy tới sau khi bấm.
  const pointsLeft = side === 'left' ? !collapsed : collapsed;
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? 'Mở rộng thanh' : 'Thu gọn thành icon'}
      aria-label={collapsed ? 'Mở rộng thanh' : 'Thu gọn thành icon'}
      className={`p-2 rounded-lg text-slate-400 hover:text-[#A4145E] hover:bg-[#FDF2F7] transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1={side === 'left' ? '9' : '15'} y1="3" x2={side === 'left' ? '9' : '15'} y2="21" />
        <polyline points={pointsLeft ? '17 9 14 12 17 15' : '13 9 16 12 13 15'} />
      </svg>
    </button>
  );
};
