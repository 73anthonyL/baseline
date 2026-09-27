import React, { useState } from 'react';
import { ScanRecord, CompareResult } from '../types';
import { computeFileSHA256, isHeicFile, convertHeicToJpeg } from '../utils/videoUtils';
import { Copy, Check, Upload } from 'lucide-react';

interface VerifyScreenProps {
  scan?: ScanRecord | null;
  compareResult?: CompareResult | null;
  onNavigateBack?: () => void;
}

export const VerifyScreen: React.FC<VerifyScreenProps> = ({ scan, compareResult, onNavigateBack }) => {
  const [copied, setCopied] = useState(false);
  const [reverifyFile, setReverifyFile] = useState<File | null>(null);
  const [reverifyHash, setReverifyHash] = useState<string | null>(null);
  const [reverifyMatch, setReverifyMatch] = useState<boolean | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const verificationUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReverifyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setIsHashing(true);
    setReverifyMatch(null);

    try {
      if (isHeicFile(file)) {
        file = await convertHeicToJpeg(file);
      }

      setReverifyFile(file);
      const hash = await computeFileSHA256(file);
      setReverifyHash(hash);

      if (scan) {
        setReverifyMatch(hash.toLowerCase() === scan.sha256Hash.toLowerCase());
      }
      setIsHashing(false);
    } catch (err) {
      console.error(err);
      setIsHashing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Condition Passport</h1>
          <p className="text-xs font-mono text-neutral-500 mt-0.5">
            Cryptographically signed ground truth certificate
          </p>
        </div>
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-6">
        {/* Record Identifiers */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono pb-6 border-b border-neutral-900">
          <div>
            <span className="text-neutral-500 block">Vehicle</span>
            <span className="text-white font-medium">{scan?.vehicleLabel || '2025 Tesla Model 3'}</span>
            <span className="text-neutral-500 block mt-0.5">{scan?.vinOrPlate || 'CA 7XYZ918'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Record ID</span>
            <span className="text-white break-all">{scan?.id || 'SCN-PICKUP-2026-9041'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Protocol</span>
            <span className="text-white">
              {scan?.targetPanel} • {scan?.targetDirection}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Timestamp</span>
            <span className="text-white">{scan?.timestamp || '2026-09-24T09:15:00Z'}</span>
          </div>
        </div>

        {/* SHA-256 Digest */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>SHA-256 Digest</span>
            <span>Immutable Stamp</span>
          </div>
          <div className="p-3 bg-black border border-neutral-900 text-neutral-300 break-all select-all">
            {scan?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
          </div>
        </div>

        {/* Verdict Status */}
        {compareResult && (
          <div className="p-4 bg-black border border-neutral-900 space-y-2 text-xs font-mono">
            <span className="text-neutral-500 block">Arbitration Finding</span>
            <p className="text-neutral-300 leading-relaxed">{compareResult.overallSummary}</p>
            <div className="flex gap-3 text-neutral-500 pt-1">
              <span>{compareResult.newDamagesCount} New</span>
              <span>•</span>
              <span>{compareResult.preExistingCount} Pre-Existing</span>
              <span>•</span>
              <span>{compareResult.uncertainCount} Uncertain</span>
            </div>
          </div>
        )}

        {/* Drag-and-drop Re-verification */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-mono text-neutral-400">Independent Re-Verification</div>
          <label className="flex items-center justify-center p-6 border border-dashed border-neutral-850 hover:border-neutral-700 bg-black cursor-pointer text-xs font-mono text-neutral-400 transition-colors">
            <span>{reverifyFile ? reverifyFile.name : 'Drop raw file here to compute hash'}</span>
            <input type="file" accept="video/*,image/*,.heic,.heif" onChange={handleReverifyUpload} className="hidden" />
          </label>

          {reverifyHash && !isHashing && (
            <div className="p-3 bg-black border border-neutral-900 text-xs font-mono space-y-1">
              <span className="text-neutral-500 block">Computed Hash:</span>
              <span className="text-neutral-300 break-all">{reverifyHash}</span>
              <div className="pt-1">
                {reverifyMatch ? (
                  <span className="text-neutral-200 font-bold">MATCH: Authentic and tamper-free</span>
                ) : (
                  <span className="text-neutral-400 font-bold">MISMATCH: Hash does not match record</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-600">Verification URL</span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
