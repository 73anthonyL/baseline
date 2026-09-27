import React, { useState } from 'react';
import { ScanRecord, CompareResult, DamageDiffItem, Verdict } from '../types';
import { VideoDamagePlayer } from './VideoDamagePlayer';
import { Loader2 } from 'lucide-react';

interface CompareScreenProps {
  pickupScan: ScanRecord;
  returnScan: ScanRecord;
  existingCompareResult?: CompareResult | null;
  onCompareUpdated?: (result: CompareResult) => void;
  onNavigateToReport?: () => void;
  onNavigateToScan?: () => void;
  onNavigateToVerify?: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({
  pickupScan,
  returnScan,
  existingCompareResult,
  onCompareUpdated,
  onNavigateToReport,
  onNavigateToScan,
  onNavigateToVerify,
}) => {
  const [compareResult, setCompareResult] = useState<CompareResult | null>(
    existingCompareResult || null
  );
  const [isComparing, setIsComparing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedDiffId, setSelectedDiffId] = useState<string | undefined>(
    existingCompareResult?.items?.[0]?.id
  );
  const [pickupSeekTime, setPickupSeekTime] = useState<number | undefined>(undefined);
  const [returnSeekTime, setReturnSeekTime] = useState<number | undefined>(undefined);

  const activeItem: DamageDiffItem | undefined = compareResult?.items?.find(
    (item) => item.id === selectedDiffId || item.returnDamageId === selectedDiffId
  ) || compareResult?.items?.[0];

  const handleSelectDiffItem = (item: DamageDiffItem) => {
    setSelectedDiffId(item.id || item.returnDamageId);
    setReturnSeekTime(item.returnTimestampSeconds);
    if (typeof item.pickupMatchedTimestampSeconds === 'number') {
      setPickupSeekTime(item.pickupMatchedTimestampSeconds);
    }
  };

  const handleRunArbitration = async () => {
    setIsComparing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/compare-scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupScan, returnScan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Comparison failed');
      }

      const result: CompareResult = await response.json();
      setCompareResult(result);
      if (result.items?.length > 0) {
        setSelectedDiffId(result.items[0].id || result.items[0].returnDamageId);
      }
      if (onCompareUpdated) onCompareUpdated(result);
      setIsComparing(false);
    } catch (err: any) {
      console.error(err);
      setIsComparing(false);
      setErrorMsg(err.message || 'Arbitration failed.');
    }
  };

  const getVerdictLabel = (verdict: Verdict) => {
    switch (verdict) {
      case 'new_since_pickup':
        return <span className="text-[10px] font-mono text-white bg-neutral-800 px-2 py-0.5 border border-neutral-700">NEW DAMAGE</span>;
      case 'pre_existing':
        return <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 border border-neutral-800">PRE-EXISTING</span>;
      case 'uncertain':
      default:
        return <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 border border-neutral-850">UNCERTAIN</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Dispute Arbitration</h1>
          <p className="text-xs font-mono text-neutral-500 mt-0.5">
            Cross-scan panel matching with conservative proof standards
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToReport && (
            <button
              onClick={onNavigateToReport}
              className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 transition-colors"
            >
              ← Back to Report
            </button>
          )}
          {!compareResult ? (
            <button
              onClick={handleRunArbitration}
              disabled={isComparing}
              className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
            >
              {isComparing ? 'Arbitrating...' : 'Run Arbitration'}
            </button>
          ) : (
            <button
              onClick={onNavigateToVerify}
              className="px-3 py-1.5 text-xs font-mono text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
            >
              Export Certificate →
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Dual Video Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
            <span>T0 Pickup Baseline</span>
            <span>{pickupScan.timestamp.slice(0, 10)}</span>
          </div>
          <VideoDamagePlayer
            videoUrl={pickupScan.videoUrl}
            frames={pickupScan.frames}
            damages={pickupScan.damages}
            seekTimestamp={pickupSeekTime}
            selectedDamageId={pickupScan.damages.find((d) => d.panel === activeItem?.panel)?.id}
            title="Pickup"
            badgeText="T0"
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-neutral-400 flex justify-between">
            <span>T1 Return Audit</span>
            <span>{returnScan.timestamp.slice(0, 10)}</span>
          </div>
          <VideoDamagePlayer
            videoUrl={returnScan.videoUrl}
            frames={returnScan.frames}
            damages={returnScan.damages}
            seekTimestamp={returnSeekTime}
            selectedDamageId={activeItem?.returnDamageId}
            title="Return"
            badgeText="T1"
          />
        </div>
      </div>

      {/* Results */}
      {compareResult && (
        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
            <p className="text-xs font-mono text-neutral-400 max-w-xl">
              {compareResult.overallSummary}
            </p>

            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
              <span className="px-2.5 py-1 border border-neutral-800 text-white">
                {compareResult.newDamagesCount} New
              </span>
              <span className="px-2.5 py-1 border border-neutral-800 text-neutral-400">
                {compareResult.preExistingCount} Pre-Existing
              </span>
              <span className="px-2.5 py-1 border border-neutral-800 text-neutral-500">
                {compareResult.uncertainCount} Uncertain
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-400">Rulings</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compareResult.items.map((item, idx) => (
                <div
                  key={item.id || item.returnDamageId || idx}
                  onClick={() => handleSelectDiffItem(item)}
                  className={`p-3 border text-xs font-mono cursor-pointer transition-colors ${
                    selectedDiffId === (item.id || item.returnDamageId)
                      ? 'border-neutral-500 bg-neutral-900 text-white'
                      : 'border-neutral-900 bg-black text-neutral-400 hover:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-white">{item.panelLabel}</span>
                    {getVerdictLabel(item.verdict)}
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
                    {item.reasoning}
                  </p>
                  <div className="text-[10px] text-neutral-600 flex justify-between pt-1 border-t border-neutral-900">
                    <span>Frame {item.returnTimestampSeconds}s</span>
                    <span>{Math.round(item.confidence * 100)}% conf</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
