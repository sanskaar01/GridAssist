import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <h1 className="text-xl font-semibold text-slate-100">
          GridAssist Operational Decision Support Console
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Platform foundation bootstrapped successfully. Live electrical network telemetry ingestion,
          fault frontier localization, decision cards, and telemetry-verified ticket workflows will be enabled in subsequent modules.
        </p>
        <div className="pt-2 flex items-center gap-4 text-xs font-mono text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Backend Engine Foundation Ready
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Frontend Application Shell Active
          </span>
        </div>
      </div>
    </div>
  );
};
