import React, { useState, useEffect } from 'react';
import { ControlRoomHeader } from '../components/layout/ControlRoomHeader';
import { ActiveFaultQueue } from '../components/queue/ActiveFaultQueue';
import { ElectricalTopologyCanvas } from '../components/topology/ElectricalTopologyCanvas';
import { FaultAssessmentPanel } from '../components/assessment/FaultAssessmentPanel';
import { ActivityTimelinePanel } from '../components/timeline/ActivityTimelinePanel';
import { fetchDashboardData } from '../services/dashboardService';
import { DashboardResponse, IncidentData } from '../types';

export const ControlRoomPage: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetchDashboardData();
      setData(res);
      setError(null);

      // Auto-select first incident if none selected
      if (res.activeIncidents.length > 0 && (!selectedIncident || !res.activeIncidents.some((i) => i.id === selectedIncident.id))) {
        setSelectedIncident(res.activeIncidents[0]);
      } else if (selectedIncident) {
        // Keep refreshed copy of selected incident
        const updated = res.activeIncidents.find((i) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Connection lost to backend server. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1500); // 1.5-second polling for live SCADA updates
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="h-screen w-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center font-mono gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-xs">CONNECTING TO KSPDB GRID CONTROLLER...</p>
      </div>
    );
  }

  const matchingTicket = selectedIncident
    ? data?.activeTickets.find((t) => t.incidentId === selectedIncident.id)
    : undefined;

  return (
    <div className="h-screen w-screen bg-[#0B0E14] flex flex-col overflow-hidden font-sans select-none">
      {/* Top Status Bar & Embedded Simulation Control Panel */}
      <ControlRoomHeader
        systemStatus={data?.systemStatus}
        pipeline={data?.pipeline}
        onRefreshData={loadData}
      />

      {error && (
        <div className="bg-rose-950/80 text-rose-300 border-b border-rose-500/30 px-4 py-1 text-xs font-mono text-center">
          ⚠ {error}
        </div>
      )}

      {/* Main 3-Column Desktop Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Active Fault Queue (~20% width) */}
        <ActiveFaultQueue
          incidents={data?.activeIncidents || []}
          selectedIncidentId={selectedIncident?.id || null}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />

        {/* Center Panel: Custom Interactive Electrical Topology Canvas (58% width - Dominating Visualization) */}
        <ElectricalTopologyCanvas
          transformers={data?.transformers || []}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />

        {/* Right Panel: Fault Assessment & Repair Ticket Operations (~22% width) */}
        <FaultAssessmentPanel
          selectedIncident={selectedIncident}
          tickets={data?.activeTickets || []}
          crews={data?.crews || []}
          onRefreshData={loadData}
        />
      </div>

      {/* Bottom Panel: Activity Timeline */}
      <ActivityTimelinePanel
        selectedIncident={selectedIncident}
        matchingTicket={matchingTicket}
      />
    </div>
  );
};
