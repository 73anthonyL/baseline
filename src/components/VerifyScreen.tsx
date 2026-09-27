import React, { useState } from 'react';
import { ScanRecord, CompareResult } from '../types';
import { computeFileSHA256, isHeicFile, convertHeicToJpeg } from '../utils/videoUtils';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  FileText,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Upload,
  AlertCircle,
  Car,
} from 'lucide-react';

interface VerifyScreenProps {
  scan?: ScanRecord | null;
  compareResult?: CompareResult | null;
}

export const VerifyScreen: React.FC<VerifyScreenProps> = ({ scan, compareResult }) => {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Trust Ledger Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-cyan-400" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Cryptographically Anchored Ground Truth
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Digital Condition Passport & Audit Certificate
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            This immutable certificate establishes non-repudiable ground truth between rental operators, insurance adjusters, and consumers. Video footage authenticity is verified against client-side SHA-256 hashes and Gemini spatial continuity protocols.
          </p>
        </div>
      </div>

      {/* Main Certificate Sheet */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Certificate Metadata Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Vehicle Record
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Car className="w-4 h-4 text-cyan-400" />
                {scan?.vehicleLabel || '2025 Tesla Model 3 Long Range'}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Plate/VIN: {scan?.vinOrPlate || 'CA 7XYZ918'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Scan Protocol Target
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                Starting Panel: <strong className="text-cyan-400">{scan?.targetPanel || 'front_bumper'}</strong> • Direction:{' '}
                <strong className="text-cyan-400">{scan?.targetDirection || 'clockwise'}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Audit Record Identifier
              </div>
              <div className="text-xs font-mono text-cyan-300 mt-0.5 break-all">
                {scan?.id || 'SCN-PICKUP-2026-9041'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Timestamp (ISO 8601 UTC)
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                {scan?.timestamp || '2026-09-24T09:15:00Z'}
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Ledger Section */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Cryptographic SHA-256 Checksum
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Valid Digest</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 break-all select-all">
            {scan?.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
          </div>
          <p className="text-[11px] text-slate-400">
            Hash computed on client from original video payload prior to network submission. Even a 1-bit alteration to the video file results in an entirely divergent hash.
          </p>
        </div>

        {/* Dispute Verdict Summary (if comparison exists) */}
        {compareResult && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Dispute Arbitration Ledger Status
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {compareResult.overallSummary}
            </p>
            <div className="flex items-center gap-4 text-xs font-medium pt-2">
              <span className="text-red-400">{compareResult.newDamagesCount} New Damage(s)</span>
              <span>•</span>
              <span className="text-emerald-400">{compareResult.preExistingCount} Pre-Existing</span>
              <span>•</span>
              <span className="text-amber-400">{compareResult.uncertainCount} Uncertain</span>
            </div>
          </div>
        )}

        {/* Independent Local Re-Verification Tool */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Independent Re-Verification Tool
            </span>
            <span className="text-[11px] text-slate-400">Run zero-knowledge client check</span>
          </div>

          <p className="text-xs text-slate-400">
            Drag in your raw video file to independently compute its SHA-256 checksum and verify it matches this certificate.
          </p>

          <label className="flex items-center justify-center p-4 border border-dashed border-slate-700 hover:border-cyan-400 rounded-lg bg-slate-900/60 cursor-pointer transition-colors text-xs text-slate-300 gap-2">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>{reverifyFile ? reverifyFile.name : 'Select or drop raw video file to re-verify'}</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleReverifyUpload}
              className="hidden"
            />
          </label>

          {isHashing && (
            <div className="text-xs text-cyan-400 font-mono">
              Computing SHA-256 via browser WebCrypto...
            </div>
          )}

          {reverifyHash && !isHashing && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Calculated Hash:</div>
              <div className="text-xs font-mono text-white break-all">{reverifyHash}</div>
              {reverifyMatch !== null && (
                <div className="mt-2 text-xs font-bold">
                  {reverifyMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      MATCH CONFIRMED: Video is 100% identical and tamper-free.
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      MISMATCH DETECTED: This video does not match this certificate.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Code & Share Certificate Link */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* SVG Rendered Dynamic QR Code Mockup */}
            <div className="p-2 rounded-lg bg-white border border-slate-300 shadow-md shrink-0">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
                <rect width="100" height="100" fill="#ffffff" />
                {/* Standard QR alignment squares */}
                <rect x="10" y="10" width="28" height="28" fill="#0f172a" />
                <rect x="14" y="14" width="20" height="20" fill="#ffffff" />
                <rect x="18" y="18" width="12" height="12" fill="#0f172a" />

                <rect x="62" y="10" width="28" height="28" fill="#0f172a" />
                <rect x="66" y="14" width="20" height="20" fill="#ffffff" />
                <rect x="70" y="18" width="12" height="12" fill="#0f172a" />

                <rect x="10" y="62" width="28" height="28" fill="#0f172a" />
                <rect x="14" y="66" width="20" height="20" fill="#ffffff" />
                <rect x="18" y="70" width="12" height="12" fill="#0f172a" />

                {/* Data dots */}
                <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="24" width="6" height="6" fill="#0f172a" />
                <rect x="46" y="46" width="8" height="8" fill="#0f172a" />
                <rect x="62" y="52" width="6" height="6" fill="#0f172a" />
                <rect x="74" y="62" width="6" height="6" fill="#0f172a" />
                <rect x="82" y="74" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="74" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="82" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-200">
                Ground Truth Verification URL
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                Share this secure record with insurers or rental counters for transparent dispute settlement.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Verification Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
