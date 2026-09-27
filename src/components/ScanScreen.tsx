import React, { useState } from 'react';
import { Panel, Direction, ScanRecord } from '../types';
import { VehicleDiagram } from './VehicleDiagram';
import { generateRandomChallenge, extractVideoKeyframes, computeFileSHA256 } from '../utils/videoUtils';
import { UploadCloud, ShieldCheck, Film, AlertTriangle, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ScanScreenProps {
  onScanCompleted: (record: ScanRecord) => void;
  onLoadSamplePair: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanCompleted, onLoadSamplePair }) => {
  // Protocol challenge state
  const [challenge, setChallenge] = useState(generateRandomChallenge());
  const [scanType, setScanType] = useState<'pickup' | 'return'>('pickup');
  const [vehicleLabel, setVehicleLabel] = useState('2025 Tesla Model 3 Long Range');
  const [vinOrPlate, setVinOrPlate] = useState('CA 7XYZ918');

  // Video processing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPct, setProgressPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client file validation
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid MP4 or MOV walkaround video file.');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    // Compute cryptographic SHA-256 on the client immediately
    try {
      setProgressStage('Anchoring cryptographic SHA-256 hash of original video...');
      const hash = await computeFileSHA256(file);
      setFileHash(hash);
      setProgressStage('');
    } catch (err: any) {
      console.error('Hash error:', err);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or record a video first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Extract 1fps keyframes capped at 30 frames, resized to 960px
      setProgressStage('Extracting calibrated keyframes (1 fps, 960px optimized)...');
      const { frames, duration } = await extractVideoKeyframes(selectedFile, 30, (pct) => {
        setProgressPct(pct);
      });

      // Step 2: Ensure SHA-256 is ready
      let finalHash = fileHash;
      if (!finalHash) {
        setProgressStage('Calculating SHA-256 digital fingerprint...');
        finalHash = await computeFileSHA256(selectedFile);
        setFileHash(finalHash);
      }

      // Step 3: Server-side Gemini 3.8 Flash multimodal analysis
      setProgressStage('Submitting to Gemini 3.8 Flash for verification & damage classification...');
      const response = await fetch('/api/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPanel: challenge.targetPanel,
          targetDirection: challenge.targetDirection,
          frames,
          vehicleLabel,
          vinOrPlate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Gemini analysis failed');
      }

      const result = await response.json();

      // Step 4: Construct complete ScanRecord
      const newRecord: ScanRecord = {
        id: `SCN-${scanType.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        type: scanType,
        vehicleLabel,
        vinOrPlate,
        timestamp: new Date().toISOString(),
        sha256Hash: finalHash,
        targetPanel: challenge.targetPanel,
        targetDirection: challenge.targetDirection,
        videoDurationSeconds: duration,
        videoUrl: videoPreviewUrl || undefined,
        frames,
        verification: result.verification,
        damages: (result.damages || []).map((dmg: any, i: number) => ({
          ...dmg,
          id: dmg.id || `DMG-${i + 1}`,
          panelLabel: dmg.panelLabel || dmg.panel,
        })),
      };

      setIsProcessing(false);
      onScanCompleted(newRecord);
    } catch (err: any) {
      console.error('Scan processing error:', err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Failed to complete video verification. Please try again.');
    }
  };

  const regenerateChallenge = () => {
    setChallenge(generateRandomChallenge());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner with Demo Quick-Load */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 border border-cyan-800/40 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              DeepMind Hackathon GroundTruth
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Capture & Verify Vehicle Walkaround</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            To prevent fraud and replay attacks, adhere to the randomized directional challenge. The video's cryptographic hash will anchor immutable ground truth.
          </p>
        </div>

        <button
          onClick={onLoadSamplePair}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Load Hackathon Demo Pair</span>
        </button>
      </div>

      {/* Main Grid: Challenge & Protocol vs Video Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Randomized Protocol Challenge */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white text-sm">Anti-Tamper Protocol</h3>
              </div>
              <button
                onClick={regenerateChallenge}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                title="Generate new randomized path"
              >
                Shuffle Path
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Follow this visual guide when scanning. Gemini will verify that the video began at the designated panel and traversed in the correct rotational direction.
            </p>

            {/* Vehicle Visual Guide Diagram */}
            <div className="py-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <VehicleDiagram
                targetPanel={challenge.targetPanel}
                targetDirection={challenge.targetDirection}
              />
            </div>
          </div>

          {/* Vehicle Metadata Inputs */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScanType('pickup')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  scanType === 'pickup'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Pickup (T0 Baseline)
              </button>
              <button
                type="button"
                onClick={() => setScanType('return')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  scanType === 'return'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Return (T1 Audit)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Vehicle Model</label>
                <input
                  type="text"
                  value={vehicleLabel}
                  onChange={(e) => setVehicleLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-400 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Plate / VIN</label>
                <input
                  type="text"
                  value={vinOrPlate}
                  onChange={(e) => setVinOrPlate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white font-mono uppercase focus:border-cyan-400 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Video Upload & Pipeline Runner */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-sm">Walkaround Video File</h3>
              </div>
              <span className="text-xs text-slate-400">Max 2 min • MP4 / WebM / MOV</span>
            </div>

            {/* Video File Dropzone / Uploader */}
            {!videoPreviewUrl ? (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl bg-slate-950/50 cursor-pointer transition-colors group">
                <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 mb-3 transition-colors" />
                <span className="text-sm font-medium text-slate-200 group-hover:text-cyan-300">
                  Select Walkaround Video
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Upload raw camera video from your mobile or laptop
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>File: <strong className="text-slate-200">{selectedFile?.name}</strong></span>
                  <label className="text-cyan-400 hover:underline cursor-pointer">
                    Change video
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Cryptographic SHA-256 Ledger Stamp */}
            {fileHash && (
              <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Client Cryptographic Digest (SHA-256)
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 truncate">
                    {fileHash}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Generated locally via WebCrypto Subtle API before network submission
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Action Button & Progress */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            {isProcessing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    {progressStage}
                  </span>
                  {progressPct > 0 && <span className="text-slate-400">{progressPct}%</span>}
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.max(15, progressPct)}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartAnalysis}
                disabled={!selectedFile}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg hover:shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Analyze Scan with Gemini 3.8 Flash</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
