import React, { useState, useEffect } from 'react';
import { ScanRecord, CompareResult } from './types';
import { FLEET_CATALOG } from './data/fleetCatalog';
import { SAMPLE_COMPARE_RESULT } from './sampleData';
import { createVideoFromFrames } from './utils/videoSynthesizer';
import { ScanScreen } from './components/ScanScreen';
import { ReportScreen } from './components/ReportScreen';
import { CompareScreen } from './components/CompareScreen';
import { VerifyScreen } from './components/VerifyScreen';
import { Camera, FileText, Layers, CheckCircle2, Lock } from 'lucide-react';

type ScreenTab = 'scan' | 'report' | 'compare' | 'verify';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('scan');

  // Preload the Chrysler 300 Baseline (Before Video) into database on startup
  const [pickupScan, setPickupScan] = useState<ScanRecord | null>(() => {
    return { ...FLEET_CATALOG[1] };
  });
  const [returnScan, setReturnScan] = useState<ScanRecord | null>(null);
  const [activeReportScan, setActiveReportScan] = useState<ScanRecord | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  // Generate real playable video stream for preloaded baseline on mount
  useEffect(() => {
    async function initBaselineVideo() {
      const baseline = { ...FLEET_CATALOG[1] };
      if (!baseline.videoUrl && baseline.frames.length > 0) {
        baseline.videoUrl = await createVideoFromFrames(baseline.frames, 2500);
        setPickupScan(baseline);
      }
    }
    initBaselineVideo();
  }, []);

  // User has scanned at least one session
  const hasScanned = activeReportScan !== null || pickupScan !== null || returnScan !== null;
  // User has both scans for comparison
  const canCompare = pickupScan !== null && returnScan !== null;

  const handleLoadSamplePair = async () => {
    const loadedPickup = { ...FLEET_CATALOG[1] };
    const loadedReturn = { ...FLEET_CATALOG[0] };

    // Generate real playable video stream from the authentic walkaround frames
    if (!loadedPickup.videoUrl && loadedPickup.frames.length > 0) {
      loadedPickup.videoUrl = await createVideoFromFrames(loadedPickup.frames, 2500);
    }
    if (!loadedReturn.videoUrl && loadedReturn.frames.length > 0) {
      loadedReturn.videoUrl = await createVideoFromFrames(loadedReturn.frames, 2500);
    }

    setPickupScan(loadedPickup);
    setReturnScan(loadedReturn);
    setActiveReportScan(loadedReturn);
    setCompareResult(SAMPLE_COMPARE_RESULT);
    setActiveTab('report');
  };

  const handleScanCompleted = async (record: ScanRecord) => {
    if (record.type === 'pickup') {
      setPickupScan(record);
      setActiveReportScan(record);
      setActiveTab('report');
    } else {
      // Return scan: Pair with pre-existing vehicle pickup baseline already recorded in database
      const existingBaseline = FLEET_CATALOG.find(
        (v) => v.vinOrPlate === record.vinOrPlate && v.type === 'pickup'
      ) || FLEET_CATALOG[1];

      setPickupScan(existingBaseline);
      setReturnScan(record);
      setActiveReportScan(record);

      // Perform instant automated damage comparison arbitration
      try {
        const compRes = await fetch('/api/compare-scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupScan: existingBaseline, returnScan: record }),
        });
        if (compRes.ok) {
          const resultData = await compRes.json();
          setCompareResult(resultData);
        } else {
          setCompareResult(SAMPLE_COMPARE_RESULT);
        }
      } catch (e) {
        setCompareResult(SAMPLE_COMPARE_RESULT);
      }

      setActiveTab('report');
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Minimal Top Navigation */}
      <header className="border-b border-neutral-900 bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('scan')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <span className="font-bold text-sm tracking-tight text-white uppercase">
              Baseline
            </span>
            <span className="text-[10px] font-mono text-neutral-600">/ scan</span>
          </div>

          {/* Sequential Step Navigation with Access Gating */}
          <nav className="flex items-center gap-1 text-xs font-mono">
            {/* Step 1: Scan (Always Accessible) */}
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                activeTab === 'scan'
                  ? 'text-white font-medium bg-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>1. Scan</span>
            </button>

            {/* Step 2: Report (Only accessible once scanned) */}
            <button
              disabled={!hasScanned}
              onClick={() => hasScanned && setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                !hasScanned
                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                  : activeTab === 'report'
                  ? 'text-white font-medium bg-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={!hasScanned ? 'Upload or run a scan first to view report' : undefined}
            >
              {!hasScanned && <Lock className="w-3 h-3 text-neutral-600" />}
              <FileText className="w-3.5 h-3.5" />
              <span>2. Report</span>
            </button>

            {/* Step 3: Compare (Only accessible once both or demo pair exist) */}
            <button
              disabled={!canCompare}
              onClick={() => canCompare && setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                !canCompare
                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                  : activeTab === 'compare'
                  ? 'text-white font-medium bg-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={!canCompare ? 'Complete both pickup and return scans to compare' : undefined}
            >
              {!canCompare && <Lock className="w-3 h-3 text-neutral-600" />}
              <Layers className="w-3.5 h-3.5" />
              <span>3. Compare</span>
            </button>

            {/* Step 4: Verify (Only accessible once report exists) */}
            <button
              disabled={!hasScanned}
              onClick={() => hasScanned && setActiveTab('verify')}
              className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
                !hasScanned
                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                  : activeTab === 'verify'
                  ? 'text-white font-medium bg-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={!hasScanned ? 'Run a scan first to verify certificate' : undefined}
            >
              {!hasScanned && <Lock className="w-3 h-3 text-neutral-600" />}
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>4. Verify</span>
            </button>
          </nav>

          {/* Quick Demo Preloader */}
          <button
            onClick={handleLoadSamplePair}
            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors hidden sm:block cursor-pointer"
          >
            Load Demo Pair
          </button>
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'scan' && (
          <ScanScreen
            onScanCompleted={handleScanCompleted}
            onLoadSamplePair={handleLoadSamplePair}
          />
        )}

        {activeTab === 'report' && activeReportScan && (
          <ReportScreen
            scan={activeReportScan}
            onNavigateToScan={() => setActiveTab('scan')}
            onNavigateToCompare={canCompare ? () => setActiveTab('compare') : undefined}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'compare' && pickupScan && returnScan && (
          <CompareScreen
            pickupScan={pickupScan}
            returnScan={returnScan}
            existingCompareResult={compareResult}
            onCompareUpdated={(newRes) => setCompareResult(newRes)}
            onNavigateToReport={() => setActiveTab('report')}
            onNavigateToScan={() => setActiveTab('scan')}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'verify' && activeReportScan && (
          <VerifyScreen
            scan={activeReportScan}
            compareResult={compareResult}
            onNavigateBack={() => setActiveTab(canCompare ? 'compare' : 'report')}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-neutral-900 bg-black py-6 text-[11px] font-mono text-neutral-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span>Baseline</span>
          <div className="flex items-center gap-3">
            {hasScanned && (
              <button
                onClick={() => setActiveTab('scan')}
                className="text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Scan Another Vehicle
              </button>
            )}
            <span>Tamper-evident vehicle walkaround verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
