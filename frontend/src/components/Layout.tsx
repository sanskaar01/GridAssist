import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Bar Header Shell */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold tracking-wider text-slate-100 text-lg">GRIDASSIST</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">v1.0.0</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Karnataka State Power Distribution Board — LT Control Room
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Footer Status Bar Shell */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>System State: Initialized</div>
        <div>GridAssist Decision Support Platform</div>
      </footer>
    </div>
  );
};
