import React, { useState } from 'react';
import { ScanRecord, DamageItem } from '../types';
import { VideoDamagePlayer } from './VideoDamagePlayer';
import { VehicleDiagram } from './VehicleDiagram';
import { Check, X, HelpCircle, ArrowUpRight } from 'lucide-react';

interface ReportScreenProps {
  scan: ScanRecord;
  onNavigateToScan?: () => void;
  onNavigateToCompare?: () => void;
  onNavigateToVerify?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  scan,
  onNavigateToScan,
  onNavigateToCompare,
  onNavigateToVerify,
}) => {
  const [selectedDamageId, setSelectedDamageId] = useState<string | undefined>(
    scan.damages?.[0]?.id
  );
  const [seekTimestamp, setSeekTimestamp] = useState<number | undefined>(undefined);
  const [activePanel, setActivePanel] = useState<string | undefined>(
    scan.damages?.[0]?.panel || 'front_bumper'
  );

  // Jump to specific part of the car
  const handleSelectPanel = (panel: string) => {
    setActivePanel(panel);
    // Find matching damage or calculate proportional angle in video
    const matchingDamage = scan.damages.find((d) => d.panel === panel);
    if (matchingDamage) {
      setSelectedDamageId(matchingDamage.id);
      setSeekTimestamp(matchingDamage.timestamp_seconds);
    } else {
      // Map vehicle panel to actual counter-clockwise walkaround progression
      const duration = scan.videoDurationSeconds || 50;
      // Proportional counter-clockwise timing weights (0 to 1)
      const panelWeights: Record<string, number> = {
        front_bumper: 0.04,
        hood: 0.08,
        passenger_fender: 0.16,
        wheel_passenger_front: 0.22,
        passenger_front_door: 0.32,
        passenger_rear_door: 0.40,
        wheel_passenger_rear: 0.46,
        passenger_quarter_panel: 0.52,
        trunk_rear_bumper: 0.60,
        wheel_driver_rear: 0.68,
        driver_quarter_panel: 0.72,
        driver_rear_door: 0.78,
        driver_front_door: 0.84,
        driver_mirror: 0.88,
        wheel_driver_front: 0.92,
        driver_fender: 0.96,
      };
      const weight = panelWeights[panel] ?? 0.05;
      const targetTime = Math.round(weight * duration * 10) / 10;
      setSeekTimestamp(Math.min(duration - 0.5, Math.max(0.5, targetTime)));
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'unclear') => {
    switch (status) {
      case 'pass':
        return <span className="text-[10px] font-mono text-neutral-300">PASS</span>;
      case 'fail':
        return <span className="text-[10px] font-mono text-neutral-500">FAIL</span>;
      case 'unclear':
      default:
        return <span className="text-[10px] font-mono text-neutral-500">UNCLEAR</span>;
    }
  };

  const damagesByPanel: Record<string, number> = {};
  scan.damages.forEach((d) => {
    damagesByPanel[d.panel] = (damagesByPanel[d.panel] || 0) + 1;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          {scan.frames[0]?.dataUrl && (
            <div className="w-16 h-12 bg-neutral-900 border border-neutral-850 shrink-0 overflow-hidden">
              <img
                src={scan.frames[0].dataUrl}
                alt={scan.vehicleLabel}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-neutral-900 text-neutral-300 px-2 py-0.5 border border-neutral-800">
                {scan.type === 'pickup' ? 'T0 Baseline' : 'T1 Audit'}
              </span>
              <span className="text-xs font-mono text-neutral-500">{scan.id}</span>
            </div>
            <h1 className="text-xl font-semibold text-white mt-0.5">{scan.vehicleLabel}</h1>
            <p className="text-xs font-mono text-neutral-500">
              {scan.vinOrPlate} • Trust: {scan.verification.overallTrustScore}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToScan && (
            <button
              onClick={onNavigateToScan}
              className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 transition-colors"
            >
              ← Back to Scan
            </button>
          )}
          {onNavigateToCompare && (
            <button
              onClick={onNavigateToCompare}
              className="px-3 py-1.5 text-xs font-mono text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              Compare Scans →
            </button>
          )}
          {onNavigateToVerify && (
            <button
              onClick={onNavigateToVerify}
              className="px-3 py-1.5 text-xs font-mono text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              Verify Certificate
            </button>
          )}
        </div>
      </div>

      {/* SHA-256 Line */}
      <div className="p-3 bg-neutral-950 border border-neutral-900 text-xs font-mono text-neutral-400 flex items-center justify-between">
        <span className="truncate">SHA-256: {scan.sha256Hash}</span>
        <span className="text-neutral-600 text-[10px] shrink-0 ml-2">VERIFIED</span>
      </div>

      {/* 4 Protocol Checks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-neutral-950 border border-neutral-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">1. Start</span>
            {getStatusBadge(scan.verification.startingPanelCheck.status)}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono truncate">
            {scan.verification.startingPanelCheck.target}
          </p>
        </div>

        <div className="p-3 bg-neutral-950 border border-neutral-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">2. Vector</span>
            {getStatusBadge(scan.verification.directionCheck.status)}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono truncate">
            {scan.verification.directionCheck.target}
          </p>
        </div>

        <div className="p-3 bg-neutral-950 border border-neutral-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">3. 360°</span>
            {getStatusBadge(scan.verification.coverageCheck.status)}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono truncate">
            {scan.verification.coverageCheck.missingPanels.length === 0 ? 'Full coverage' : 'Incomplete'}
          </p>
        </div>

        <div className="p-3 bg-neutral-950 border border-neutral-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">4. Live</span>
            {getStatusBadge(scan.verification.authenticityCheck.status)}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono truncate">
            Plate: {scan.verification.licensePlateCheck.plateNumber || 'Verified'}
          </p>
        </div>
      </div>

      {/* Player and Damage Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <VideoDamagePlayer
            videoUrl={scan.videoUrl}
            frames={scan.frames}
            damages={scan.damages}
            selectedDamageId={selectedDamageId}
            seekTimestamp={seekTimestamp}
            onSelectDamage={(d) => {
              setSelectedDamageId(d.id);
              setActivePanel(d.panel);
              setSeekTimestamp(d.timestamp_seconds);
            }}
            title={scan.vehicleLabel}
            badgeText={scan.type}
          />
          <p className="text-xs font-mono text-neutral-500 leading-relaxed">
            {scan.verification.summary}
          </p>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-neutral-950 border border-neutral-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white">Damages ({scan.damages.length})</span>
              <span className="text-[10px] font-mono text-neutral-500">Click to jump in video</span>
            </div>

            {scan.damages.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono py-4 text-center">Zero damage detected</p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {scan.damages.map((dmg, idx) => (
                  <div
                    key={dmg.id}
                    onClick={() => {
                      setSelectedDamageId(dmg.id);
                      setActivePanel(dmg.panel);
                      setSeekTimestamp(dmg.timestamp_seconds);
                    }}
                    className={`p-2.5 border text-xs cursor-pointer font-mono ${
                      selectedDamageId === dmg.id
                        ? 'border-neutral-500 bg-neutral-900 text-white'
                        : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{dmg.panelLabel}</span>
                      <span className="text-[10px] text-neutral-400">{dmg.severity}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2">{dmg.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-900 space-y-2">
            <div className="text-[10px] font-mono text-neutral-500 flex justify-between">
              <span>Interactive Schematic</span>
              <span>Click part to jump video</span>
            </div>
            <div className="flex justify-center">
              <VehicleDiagram
                interactive={true}
                activePanel={activePanel as any}
                onSelectPanel={(p) => handleSelectPanel(p)}
                damagesByPanel={damagesByPanel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
