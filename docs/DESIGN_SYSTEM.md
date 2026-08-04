# SCADA DESIGN SYSTEM SPECIFICATION
**GridAssist Operations Theater Phase 2**

---

## 1. Design System Tokens

### Colors
```css
:root {
  --color-bg-space: #070A0F;
  --color-bg-surface: #0E131F;
  --color-bg-panel: #161B22;
  --color-border-subtle: #21262D;
  --color-border-default: #30363D;
  
  --color-energized: #10B981;
  --color-particle: #6EE7B7;
  --color-fault: #EF4444;
  --color-fault-glow: rgba(239, 68, 68, 0.4);
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  --color-dark-node: #484F58;
}
```

### Typography
```css
:root {
  --font-mono: 'JetBrains Mono', 'Space Mono', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
  
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-lg: 16px;
}
```

---

## 2. Reusable UI Components

### 2.1 LED Status Indicator Badge
A compact SCADA service badge with pulsing status LED:
```tsx
export const LEDStatusBadge = ({ label, status }: { label: string; status: 'HEALTHY' | 'WARNING' | 'OFFLINE' }) => (
  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#0D1117] px-2.5 py-1 rounded border border-[#30363D]">
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
        status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-rose-400'
      }`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${
        status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />
    </span>
    <span className="text-gray-300 uppercase">{label}</span>
  </div>
);
```

### 2.2 SCADA Action Button
```tsx
export const SCADAButton = ({ label, icon: Icon, onClick, variant = 'primary' }: any) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
      variant === 'primary' 
        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' 
        : 'bg-[#161B22] hover:bg-[#21262D] text-gray-200 border border-[#30363D]'
    }`}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    <span>{label}</span>
  </button>
);
```
