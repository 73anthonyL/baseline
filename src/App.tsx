import React, { useState } from 'react';
import { ScanRecord, CompareResult } from './types';
import {
  SAMPLE_PICKUP_SCAN,
  SAMPLE_RETURN_SCAN,
  SAMPLE_COMPARE_RESULT,
  getSamplePickupFrames,
  getSampleReturnFrames,
} from './sampleData';
import { ScanScreen } from './components/ScanScreen';
import { ReportScreen } from './components/ReportScreen';
import { CompareScreen } from './components/CompareScreen';
import { VerifyScreen } from './components/VerifyScreen';
import {
  ShieldCheck,
  Camera,
  FileText,
  Layers,
  CheckCircle2,
  Sparkles,
  Car,
  ChevronRight,
} from 'lucide-react';

type ScreenTab = 'scan' | 'report' | 'compare' | 'verify';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('scan');

  // In-memory scans and comparison state
  const [pickupScan, setPickupScan] = useState<ScanRecord | null>(null);
  const [returnScan, setReturnScan] = useState<ScanRecord | null>(null);
  const [activeReportScan, setActiveReportScan] = useState<ScanRecord | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  // Quick Action: Preload sample pair for offline / instantaneous hackathon demonstration
  const handleLoadSamplePair = () => {
    const pFrames = getSamplePickupFrames();
    const rFrames = getSampleReturnFrames();

    const loadedPickup: ScanRecord = {
      ...SAMPLE_PICKUP_SCAN,
      frames: pFrames,
    };

    const loadedReturn: ScanRecord = {
      ...SAMPLE_RETURN_SCAN,
      frames: rFrames,
    };

    setPickupScan(loadedPickup);
    setReturnScan(loadedReturn);
    setActiveReportScan(loadedReturn);
    setCompareResult(SAMPLE_COMPARE_RESULT);
    setActiveTab('compare');
  };

  const handleScanCompleted = (record: ScanRecord) => {
    if (record.type === 'pickup') {
      setPickupScan(record);
    } else {
      setReturnScan(record);
    }
    setActiveReportScan(record);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => setActiveTab('scan')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  GroundTruth
                </span>
                <span className="text-cyan-400 font-extrabold text-base">Auto</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/80 ml-1">
                  AI Studio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Verifiable Vehicle Condition & Dispute Arbitration
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Ordered: Scan -> Report -> Compare -> Verify) */}
          <nav className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'scan'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>1. Scan</span>
            </button>

            <button
              onClick={() => {
                if (activeReportScan || pickupScan || returnScan) {
                  setActiveTab('report');
                } else {
                  handleLoadSamplePair();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Report</span>
            </button>

            <button
              onClick={() => {
                if (pickupScan && returnScan) {
                  setActiveTab('compare');
                } else {
                  handleLoadSamplePair();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'compare'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Compare</span>
            </button>

            <button
              onClick={() => {
                if (activeReportScan || pickupScan || returnScan) {
                  setActiveTab('verify');
                } else {
                  handleLoadSamplePair();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'verify'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>4. Verify</span>
            </button>
          </nav>

          {/* Quick Demo Preload Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLoadSamplePair}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold border border-indigo-500/40 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Sample Scans</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'scan' && (
          <ScanScreen
            onScanCompleted={handleScanCompleted}
            onLoadSamplePair={handleLoadSamplePair}
          />
        )}

        {activeTab === 'report' && (
          <ReportScreen
            scan={activeReportScan || returnScan || pickupScan || SAMPLE_RETURN_SCAN}
            onNavigateToCompare={() => {
              if (pickupScan && returnScan) {
                setActiveTab('compare');
              } else {
                handleLoadSamplePair();
              }
            }}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'compare' && (
          <CompareScreen
            pickupScan={pickupScan || SAMPLE_PICKUP_SCAN}
            returnScan={returnScan || SAMPLE_RETURN_SCAN}
            existingCompareResult={compareResult || SAMPLE_COMPARE_RESULT}
            onCompareUpdated={(newRes) => setCompareResult(newRes)}
            onNavigateToVerify={() => setActiveTab('verify')}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyScreen
            scan={activeReportScan || returnScan || pickupScan || SAMPLE_RETURN_SCAN}
            compareResult={compareResult}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Built for Google DeepMind Hackathon</span>
            <span>•</span>
            <span>Gemini 3.8 Flash Multimodal & Client SHA-256 Ledger</span>
          </div>
          <div className="text-slate-400">
            Ground Truth: Protecting Renters, Insurers & Fleets with Non-Repudiable Evidence
          </div>
        </div>
      </footer>
    </div>
  );
}
