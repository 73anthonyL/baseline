import React, { useState } from 'react';
import { ScanRecord, DamageItem } from '../types';
import { VideoDamagePlayer } from './VideoDamagePlayer';
import { VehicleDiagram } from './VehicleDiagram';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileCheck2,
  Share2,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface ReportScreenProps {
  scan: ScanRecord;
  onNavigateToCompare?: () => void;
  onNavigateToVerify?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  scan,
  onNavigateToCompare,
  onNavigateToVerify,
}) => {
  const [selectedDamageId, setSelectedDamageId] = useState<string | undefined>(
    scan.damages?.[0]?.id
  );

  const getStatusBadge = (status: 'pass' | 'fail' | 'unclear') => {
    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            PASS
          </span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800">
            <AlertCircle className="w-3 h-3 text-red-400" />
            FAIL
          </span>
        );
      case 'unclear':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            UNCLEAR
          </span>
        );
    }
  };

  // Group damages by panel for diagram markers
  const damagesByPanel: Record<string, number> = {};
  scan.damages.forEach((d) => {
    damagesByPanel[d.panel] = (damagesByPanel[d.panel] || 0) + 1;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header bar with Certificate ID, Hash and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                scan.type === 'pickup'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {scan.type === 'pickup' ? 'T0 Baseline Record' : 'T1 Return Audit Record'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {scan.id}</span>
          </div>

          <h1 className="text-xl font-bold text-white mt-1">{scan.vehicleLabel}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>VIN/Plate: <strong className="text-slate-200">{scan.vinOrPlate}</strong></span>
            <span>•</span>
            <span>Recorded: {new Date(scan.timestamp).toLocaleString()}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">
              Trust Score: {scan.verification.overallTrustScore}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCompare && (
            <button
              onClick={onNavigateToCompare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Compare Scans</span>
            </button>
          )}

          {onNavigateToVerify && (
            <button
              onClick={onNavigateToVerify}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verify Ground Truth</span>
            </button>
          )}
        </div>
      </div>

      {/* SHA-256 Fingerprint Digest Banner */}
      <div className="px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 shrink-0 font-medium">Cryptographic SHA-256 Digest:</span>
          <span className="text-cyan-300 font-mono truncate">{scan.sha256Hash}</span>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0 ml-2 hidden sm:inline">
          Immutable Client Stamp
        </span>
      </div>

      {/* Verification Integrity Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Check 1: Starting Panel */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">1. Start Panel</span>
            {getStatusBadge(scan.verification.startingPanelCheck.status)}
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Target: <span className="text-slate-200">{scan.verification.startingPanelCheck.target}</span>
            <br />
            {scan.verification.startingPanelCheck.reason}
          </div>
        </div>

        {/* Check 2: Rotational Direction */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">2. Direction Vector</span>
            {getStatusBadge(scan.verification.directionCheck.status)}
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Target: <span className="text-slate-200">{scan.verification.directionCheck.target}</span>
            <br />
            {scan.verification.directionCheck.reason}
          </div>
        </div>

        {/* Check 3: 360 Coverage */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">3. 360° Coverage</span>
            {getStatusBadge(scan.verification.coverageCheck.status)}
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            {scan.verification.coverageCheck.missingPanels.length > 0 ? (
              <span className="text-amber-400">
                Missing: {scan.verification.coverageCheck.missingPanels.join(', ')}
              </span>
            ) : (
              <span>All 4 sides and perimeter wheels clearly captured.</span>
            )}
          </div>
        </div>

        {/* Check 4: Screen Re-recording & Plate */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">4. Authenticity</span>
            {getStatusBadge(scan.verification.authenticityCheck.status)}
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Plate: <strong className="text-slate-200">{scan.verification.licensePlateCheck.plateNumber || 'Verified'}</strong>
            <br />
            {scan.verification.authenticityCheck.reason}
          </div>
        </div>
      </div>

      {/* Main Analysis View: Video Player (Left) + Damage List & Diagram (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <VideoDamagePlayer
            videoUrl={scan.videoUrl}
            frames={scan.frames}
            damages={scan.damages}
            selectedDamageId={selectedDamageId}
            onSelectDamage={(d) => setSelectedDamageId(d.id)}
            title={`Condition Video • ${scan.vehicleLabel}`}
            badgeText={scan.type}
          />

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200">Forensic Inspector Summary:</strong>{' '}
            {scan.verification.summary}
          </div>
        </div>

        {/* Right Column: Classified Damages & Vehicle Diagram */}
        <div className="lg:col-span-5 space-y-4">
          {/* Damage Items List */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">
                Classified Damage Findings ({scan.damages.length})
              </h3>
              <span className="text-[11px] text-slate-400">Click item to inspect timestamp</span>
            </div>

            {scan.damages.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No exterior damages detected. Vehicle surface is intact.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {scan.damages.map((dmg, idx) => {
                  const isSelected = dmg.id === selectedDamageId;
                  return (
                    <div
                      key={dmg.id}
                      onClick={() => setSelectedDamageId(dmg.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{dmg.panelLabel}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            dmg.severity === 'severe'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : dmg.severity === 'moderate'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                          }`}
                        >
                          {dmg.severity} • {dmg.type.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {dmg.description}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Timestamp: {dmg.timestamp_seconds.toFixed(1)}s (Frame #{dmg.frame_index})</span>
                        <span className="text-cyan-400 font-sans">
                          {Math.round(dmg.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicle Schematic with Damage Pins */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-300 mb-2 self-start">
              Damage Location Map
            </h4>
            <div className="w-full flex justify-center">
              <VehicleDiagram
                activePanel={scan.damages.find((d) => d.id === selectedDamageId)?.panel}
                damagesByPanel={damagesByPanel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
