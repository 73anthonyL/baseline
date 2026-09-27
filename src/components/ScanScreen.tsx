import React, { useState } from 'react';
import { Panel, Direction, ScanRecord } from '../types';
import { VehicleDiagram } from './VehicleDiagram';
import { FLEET_CATALOG } from '../data/fleetCatalog';
import {
  generateRandomChallenge,
  extractVideoKeyframes,
  computeFileSHA256,
  isHeicFile,
  convertHeicToJpeg,
} from '../utils/videoUtils';
import {
  Upload,
  ArrowRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Car,
  ChevronDown,
} from 'lucide-react';

interface ScanScreenProps {
  onScanCompleted: (record: ScanRecord) => void;
  onLoadSamplePair: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanCompleted, onLoadSamplePair }) => {
  // Pre-seed challenge to Front Bumper & Counter-Clockwise matching the Chrysler 300 walkaround vector
  const [challenge, setChallenge] = useState<{
    targetPanel: Panel;
    targetDirection: Direction;
    challengeCode: string;
  }>({
    targetPanel: 'front_bumper',
    targetDirection: 'counter-clockwise',
    challengeCode: 'CHL-300CCW',
  });
  // Default to Return scan so hackathon demo immediately checks in against pre-existing pickup baseline
  const [scanType, setScanType] = useState<'pickup' | 'return'>('return');
  
  // Selected vehicle preset or custom input
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(FLEET_CATALOG[0].id);
  const [vehicleLabel, setVehicleLabel] = useState(FLEET_CATALOG[0].vehicleLabel);
  const [vinOrPlate, setVinOrPlate] = useState(FLEET_CATALOG[0].vinOrPlate);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find photo of current vehicle
  const currentVehicle = FLEET_CATALOG.find((v) => v.id === selectedVehicleId) || FLEET_CATALOG[0];

  const handleSelectVehiclePreset = (vId: string) => {
    setSelectedVehicleId(vId);
    const found = FLEET_CATALOG.find((v) => v.id === vId);
    if (found) {
      setVehicleLabel(found.vehicleLabel);
      setVinOrPlate(found.vinOrPlate);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|m4v)$/i);
    if (!isVideo) {
      setErrorMsg('Please upload a video file (.mp4, .mov, .webm).');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    try {
      const hash = await computeFileSHA256(file);
      setFileHash(hash);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setErrorMsg('Select a file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let frames: { timestamp_seconds: number; frame_index: number; dataUrl: string }[] = [];
      let duration = 5;

      if (selectedFile.type.startsWith('video/')) {
        setProgressStage('Extracting frames...');
        const extracted = await extractVideoKeyframes(selectedFile, 30);
        frames = extracted.frames;
        duration = extracted.duration;
      } else {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        frames = [{ timestamp_seconds: 0.5, frame_index: 0, dataUrl }];
        duration = 1;
      }

      let finalHash = fileHash;
      if (!finalHash) {
        finalHash = await computeFileSHA256(selectedFile);
        setFileHash(finalHash);
      }

      setProgressStage('Analyzing with Gemini...');
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
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }

      const result = await response.json();

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
        specs: currentVehicle.specs,
      };

      setIsProcessing(false);
      onScanCompleted(newRecord);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setErrorMsg(err.message || 'Inspection failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header with Vehicle Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Vehicle Walkaround Scan</h1>
          <p className="text-xs font-mono text-neutral-500 mt-0.5">
            Identify car • Follow randomized motion vector • Anchor SHA-256
          </p>
        </div>

        <button
          onClick={onLoadSamplePair}
          className="text-xs font-mono text-neutral-400 hover:text-white border border-neutral-800 px-3 py-1.5 transition-colors self-start sm:self-auto"
        >
          Load Demo Pair
        </button>
      </div>

      {/* 2. Vehicle Identification Bar with Real Car Photography */}
      <div className="p-4 bg-neutral-950 border border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Real Car Photo Thumbnail */}
          <div className="w-16 h-12 bg-neutral-900 border border-neutral-850 shrink-0 overflow-hidden">
            <img
              src={currentVehicle.frames[0]?.dataUrl}
              alt={vehicleLabel}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">Assigned Asset</div>
            <div className="text-sm font-medium text-white truncate">{vehicleLabel}</div>
            <div className="text-[11px] font-mono text-neutral-400">{vinOrPlate}</div>
          </div>
        </div>

        {/* Dropdown to switch vehicle quickly */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedVehicleId}
            onChange={(e) => handleSelectVehiclePreset(e.target.value)}
            className="bg-black border border-neutral-800 text-xs font-mono text-neutral-300 py-1.5 px-2.5 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            {FLEET_CATALOG.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicleLabel} ({v.vinOrPlate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main Scanning Console: Vector Guide vs Media Ingestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Simplified Schematic Diagram (Used strictly as instruction of how to scan) */}
        <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">
              Protocol Instruction (Start & Direction)
            </span>
            <button
              onClick={() => setChallenge(generateRandomChallenge())}
              className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Simple model diagram showing strictly starting point and rotational direction */}
          <div className="py-2 bg-black border border-neutral-900 flex justify-center">
            <VehicleDiagram
              targetPanel={challenge.targetPanel}
              targetDirection={challenge.targetDirection}
            />
          </div>

          {/* Clean Step-by-Step Scan Order without verbose timestamps */}
          <div className="p-3 bg-black border border-neutral-900 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-white font-medium">Recording Order:</span>
              <span className="text-[10px] text-neutral-500 uppercase">{challenge.targetDirection}</span>
            </div>

            <ol className="text-[11px] text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
              {challenge.targetDirection === 'clockwise' ? (
                <>
                  <li><span className="text-white font-medium">Start facing Front Bumper & Badge</span></li>
                  <li>Walk right along <span className="text-white">Driver Side</span> (front wheel, doors, rear wheel)</li>
                  <li>Pan across <span className="text-white">Rear Bumper & License Plate</span></li>
                  <li>Continue along <span className="text-white">Passenger Side</span> (rear wheel, doors, front wheel)</li>
                  <li>Finish back at <span className="text-white">Front Bumper</span> to complete 360°</li>
                </>
              ) : (
                <>
                  <li><span className="text-white font-medium">Start facing Front Bumper & Badge</span></li>
                  <li>Walk left along <span className="text-white">Passenger Side</span> (front wheel, doors, rear wheel)</li>
                  <li>Pan across <span className="text-white">Rear Bumper & License Plate</span></li>
                  <li>Continue along <span className="text-white">Driver Side</span> (rear wheel, doors, front wheel)</li>
                  <li>Finish back at <span className="text-white">Front Bumper</span> to complete 360°</li>
                </>
              )}
            </ol>
          </div>

          <div className="text-[11px] font-mono text-neutral-500 space-y-0.5">
            <div>• Target duration: 15–25s continuous walkaround</div>
            <div>• Keep camera 3–5 ft away, mid-height</div>
            <div>• Protocol Challenge: <span className="text-neutral-300">{challenge.challengeCode}</span></div>
          </div>

          {/* Stage toggle */}
          <div className="pt-2 border-t border-neutral-900 flex gap-2">
            <button
              type="button"
              onClick={() => setScanType('pickup')}
              className={`flex-1 py-1.5 text-xs font-mono border transition-colors ${
                scanType === 'pickup'
                  ? 'bg-neutral-800 border-neutral-700 text-white font-medium'
                  : 'border-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              T0 Pickup Baseline
            </button>
            <button
              type="button"
              onClick={() => setScanType('return')}
              className={`flex-1 py-1.5 text-xs font-mono border transition-colors ${
                scanType === 'return'
                  ? 'bg-neutral-800 border-neutral-700 text-white font-medium'
                  : 'border-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              T1 Return Audit
            </button>
          </div>
        </div>

        {/* Right: Video Upload & Ingestion */}
        <div className="p-5 bg-neutral-950 border border-neutral-900 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Walkaround Video</span>
              <span>MP4 / MOV / WEBM</span>
            </div>

            {!videoPreviewUrl ? (
              <label className="flex flex-col items-center justify-center p-10 border border-dashed border-neutral-800 hover:border-neutral-600 bg-black cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-neutral-500 mb-2" />
                <span className="text-xs text-neutral-300 font-mono">Select or drop vehicle video</span>
                <span className="text-[10px] text-neutral-600 font-mono mt-1">
                  15–25s continuous 360° walkaround
                </span>
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.m4v"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-2">
                {/* Visual Feedback of Successful Upload */}
                <div className="flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-700 text-xs font-mono">
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold">Video Ingested Successfully</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                  </span>
                </div>

                <div className="aspect-video bg-black border border-neutral-900 overflow-hidden">
                  <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span className="truncate">{selectedFile?.name}</span>
                  <label className="text-neutral-300 hover:underline cursor-pointer">
                    Replace Video
                    <input
                      type="file"
                      accept="video/*,.mp4,.mov,.webm,.m4v"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {fileHash && (
              <div className="p-2.5 bg-black border border-neutral-900 text-[10px] font-mono text-neutral-400 space-y-0.5">
                <div className="text-neutral-500">SHA-256 Digest:</div>
                <div className="truncate text-neutral-300 select-all">{fileHash}</div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2 text-xs text-red-400 flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-900">
            {isProcessing ? (
              <div className="text-xs font-mono text-neutral-400 flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{progressStage}</span>
              </div>
            ) : (
              <button
                onClick={handleStartAnalysis}
                disabled={!selectedFile}
                className="w-full py-2 bg-white hover:bg-neutral-200 text-black text-xs font-medium disabled:opacity-30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Process Walkaround</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
