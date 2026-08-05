import React, { useState } from 'react';
import { HelpCircle, Pin, PinOff } from 'lucide-react';

export const SCADAHelpToggle: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsOpen(false);
    }
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned((prev) => !prev);
    setIsOpen(true);
  };

  return (
    <div
      className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 font-mono text-xs select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating (?) SCADA Glass Button */}
      <button
        type="button"
        onClick={togglePin}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur transition-all duration-200 shadow-xl ${
          isPinned
            ? 'bg-blue-600/90 border-blue-400 text-white shadow-blue-500/30'
            : isOpen
            ? 'bg-[#161B22]/95 border-blue-500 text-blue-400 shadow-blue-500/20'
            : 'bg-[#161B22]/80 border-[#30363D] text-gray-400 hover:text-white hover:border-blue-400 hover:bg-[#161B22]/95'
        }`}
        title={isPinned ? 'Legend Pinned (Click to Unpin)' : 'Hover for Legend (Click to Pin)'}
      >
        <HelpCircle className="w-4 h-4 text-blue-400 animate-pulse" />
        <span className="font-bold tracking-wider">GRAPH SYMBOLS</span>
        {isPinned ? (
          <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ) : (
          <PinOff className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Contextual Legend Drawer Card */}
      {isOpen && (
        <div
          className={`w-72 bg-[#161B22]/95 border border-[#30363D] p-3.5 rounded-xl text-[11px] text-gray-300 backdrop-blur shadow-2xl space-y-2.5 transform transition-all duration-200 ease-out origin-top-right ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
            <span className="font-bold text-white text-xs tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              ELECTRICAL TOPOLOGY LEGEND
            </span>
            <button
              type="button"
              onClick={togglePin}
              className="text-[10px] text-gray-400 hover:text-amber-400 flex items-center gap-1 bg-[#21262D] px-2 py-0.5 rounded border border-[#30363D]"
            >
              {isPinned ? 'UNPIN' : 'PIN'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 bg-blue-500 rotate-45 border border-white font-bold text-[7px] flex items-center justify-center text-white shrink-0">
                SUB
              </span>
              <span>33kV Grid Substation (<span className="text-blue-400">SUB-01</span>)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 bg-amber-500 rounded-sm border border-black font-bold text-[8px] flex items-center justify-center text-black shrink-0">
                DT
              </span>
              <span>Distribution Transformer (11kV/415V)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] shrink-0" />
              <span>Live Pole Node (Energized)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444] shrink-0" />
              <span>Dark Pole Node (Outage)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B] shrink-0" />
              <span>Sensor Anomaly (False Alarm Blocked)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-6 h-1.5 bg-emerald-500 rounded shrink-0" />
              <span className="text-emerald-400 font-semibold">Power Flow Particles (Live Current)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-6 h-1.5 bg-rose-500 rounded shadow-[0_0_8px_#EF4444] shrink-0" />
              <span className="text-rose-400 font-bold">Failed Line Span (Fault Frontier)</span>
            </div>
          </div>

          <div className="border-t border-[#30363D] pt-2 text-[10px] text-gray-400 italic flex justify-between">
            <span>Click button to pin legend open</span>
            {isPinned && <span className="text-amber-400 font-bold">PINNED</span>}
          </div>
        </div>
      )}
    </div>
  );
};
