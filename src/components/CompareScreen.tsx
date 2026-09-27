import React, { useState } from 'react';
import { ScanRecord, CompareResult, DamageDiffItem, Verdict } from '../types';
import { VideoDamagePlayer } from './VideoDamagePlayer';
import {
  Layers,
  Scale,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface CompareScreenProps {
  pickupScan: ScanRecord;
  returnScan: ScanRecord;
  existingCompareResult?: CompareResult | null;
  onCompareUpdated?: (result: CompareResult) => void;
  onNavigateToVerify?: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({
  pickupScan,
  returnScan,
  existingCompareResult,
  onCompareUpdated,
  onNavigateToVerify,
}) => {
  const [compareResult, setCompareResult] = useState<CompareResult | null>(
    existingCompareResult || null
  );
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active selected damage diff item
  const [selectedDiffId, setSelectedDiffId] = useState<string | undefined>(
    existingCompareResult?.items?.[0]?.id
  );

  const activeItem: DamageDiffItem | undefined = compareResult?.items?.find(
    (item) => item.id === selectedDiffId || item.returnDamageId === selectedDiffId
  ) || compareResult?.items?.[0];

  const handleRunArbitration = async () => {
    setIsComparing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/compare-scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupScan,
          returnScan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Arbitration diff failed');
      }

      const result: CompareResult = await response.json();
      setCompareResult(result);
      if (result.items?.length > 0) {
        setSelectedDiffId(result.items[0].id || result.items[0].returnDamageId);
      }
      if (onCompareUpdated) onCompareUpdated(result);
      setIsComparing(false);
    } catch (err: any) {
      console.error('Compare arbitration error:', err);
      setIsComparing(false);
      setErrorMsg(err.message || 'Failed to complete dispute comparison with Gemini.');
    }
  };

  const getVerdictBadge = (verdict: Verdict) => {
    switch (verdict) {
      case 'new_since_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-red-950 text-red-300 border border-red-800 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            NEW SINCE PICKUP
          </span>
        );
      case 'pre_existing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            PRE-EXISTING AT PICKUP
          </span>
        );
      case 'uncertain':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800 shadow-sm">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            UNCERTAIN (INSUFFICIENT PROOF)
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Compare Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dispute Arbitration Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">T0 Baseline vs T1 Return Audit</span>
          </div>

          <h1 className="text-xl font-bold text-white mt-1">
            Ground Truth Cross-Scan Comparison
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multimodal frame-by-frame panel matching. Conservative bias protects consumers by labeling obscured or low-confidence panels as uncertain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!compareResult ? (
            <button
              onClick={handleRunArbitration}
              disabled={isComparing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Arbitrating with Gemini...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Run Dispute Arbitration</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onNavigateToVerify}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Export Ground Truth Certificate</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Side-by-Side Independent Video Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* T0 Pickup Player */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
              Pickup (T0 Baseline)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{pickupScan.timestamp.slice(0, 16).replace('T', ' ')}</span>
          </div>

          <VideoDamagePlayer
            videoUrl={pickupScan.videoUrl}
            frames={pickupScan.frames}
            damages={pickupScan.damages}
            selectedDamageId={
              pickupScan.damages.find((d) => d.panel === activeItem?.panel)?.id
            }
            title="Pickup Inspection"
            badgeText="T0 BASELINE"
          />
        </div>

        {/* T1 Return Player */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Return (T1 Audit)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{returnScan.timestamp.slice(0, 16).replace('T', ' ')}</span>
          </div>

          <VideoDamagePlayer
            videoUrl={returnScan.videoUrl}
            frames={returnScan.frames}
            damages={returnScan.damages}
            selectedDamageId={activeItem?.returnDamageId}
            title="Return Inspection"
            badgeText="T1 AUDIT"
          />
        </div>
      </div>

      {/* Arbitration Summary Stats Banner */}
      {compareResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Arbitration Verdict Summary
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {compareResult.overallSummary}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800">
                <div className="text-lg font-bold text-red-300">
                  {compareResult.newDamagesCount}
                </div>
                <div className="text-[10px] text-red-400 uppercase font-semibold">New Damage</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800">
                <div className="text-lg font-bold text-emerald-300">
                  {compareResult.preExistingCount}
                </div>
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">Pre-Existing</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800">
                <div className="text-lg font-bold text-amber-300">
                  {compareResult.uncertainCount}
                </div>
                <div className="text-[10px] text-amber-400 uppercase font-semibold">Uncertain</div>
              </div>
            </div>
          </div>

          {/* Damage Discrepancy Breakdown List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              Individual Damage Item Rulings ({compareResult.items.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compareResult.items.map((item, idx) => {
                const isSelected =
                  item.id === selectedDiffId || item.returnDamageId === selectedDiffId;
                return (
                  <div
                    key={item.id || item.returnDamageId || idx}
                    onClick={() => setSelectedDiffId(item.id || item.returnDamageId)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {item.panelLabel}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.type.replace('_', ' ')} • {item.severity} severity
                        </div>
                      </div>
                      {getVerdictBadge(item.verdict)}
                    </div>

                    <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 mb-2">
                      <div className="text-[11px] font-medium text-slate-300">
                        Gemini Arbitration Finding:
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {item.reasoning}
                      </p>
                    </div>

                    {item.pickupEvidenceObservation && (
                      <div className="text-[10px] text-cyan-300/90 font-mono">
                        Pickup Baseline Evidence: {item.pickupEvidenceObservation}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Return Sec: {item.returnTimestampSeconds}s</span>
                      <span className="text-slate-300">
                        Confidence: {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
