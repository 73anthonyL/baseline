import React, { useRef, useState, useEffect } from 'react';
import { DamageItem, VideoFrame } from '../types';
import { Play, Pause, RotateCcw, Crosshair, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface VideoDamagePlayerProps {
  videoUrl?: string;
  frames?: VideoFrame[];
  damages: DamageItem[];
  selectedDamageId?: string;
  onSelectDamage?: (damage: DamageItem) => void;
  title?: string;
  badgeText?: string;
}

export const VideoDamagePlayer: React.FC<VideoDamagePlayerProps> = ({
  videoUrl,
  frames = [],
  damages,
  selectedDamageId,
  onSelectDamage,
  title,
  badgeText,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'video' | 'keyframes'>(videoUrl ? 'video' : 'keyframes');

  // Find active damage if any
  const activeDamage = damages.find((d) => d.id === selectedDamageId);

  // Sync when selectedDamage changes externally
  useEffect(() => {
    if (activeDamage) {
      if (videoRef.current && videoUrl) {
        videoRef.current.currentTime = activeDamage.timestamp_seconds;
        setCurrentTime(activeDamage.timestamp_seconds);
      }
      if (frames.length > 0) {
        const frameIdx = activeDamage.frame_index < frames.length ? activeDamage.frame_index : 0;
        setSelectedFrameIndex(frameIdx);
      }
    }
  }, [selectedDamageId, activeDamage, videoUrl, frames]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 1);
    }
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
    // Also sync closest keyframe
    if (frames.length > 0) {
      const closestIdx = frames.reduce((prevIdx, curr, currIdx) => {
        return Math.abs(curr.timestamp_seconds - sec) < Math.abs(frames[prevIdx].timestamp_seconds - sec)
          ? currIdx
          : prevIdx;
      }, 0);
      setSelectedFrameIndex(closestIdx);
    }
  };

  // Convert normalized box [ymin, xmin, ymax, xmax] (0..1000) to CSS percentages
  const getBoxStyle = (box_2d: [number, number, number, number]) => {
    const [ymin, xmin, ymax, xmax] = box_2d;
    return {
      top: `${(ymin / 1000) * 100}%`,
      left: `${(xmin / 1000) * 100}%`,
      width: `${((xmax - xmin) / 1000) * 100}%`,
      height: `${((ymax - ymin) / 1000) * 100}%`,
    };
  };

  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {title && <span className="font-semibold text-sm text-slate-100">{title}</span>}
          {badgeText && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-cyan-400 border border-slate-700">
              {badgeText}
            </span>
          )}
        </div>

        {/* Toggle between Video stream and Keyframe inspector if video exists */}
        {videoUrl && frames.length > 0 && (
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('video')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'video' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Video Player
            </button>
            <button
              onClick={() => setViewMode('keyframes')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'keyframes' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Keyframes ({frames.length})
            </button>
          </div>
        )}
      </div>

      {/* Main viewport */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {viewMode === 'video' && videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              onClick={togglePlay}
            />

            {/* Damage Bounding Box Overlay on Video if active and matches current time window */}
            {activeDamage && Math.abs(currentTime - activeDamage.timestamp_seconds) < 2.5 && (
              <div
                className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none transition-all duration-150 animate-pulse"
                style={getBoxStyle(activeDamage.box_2d)}
              >
                <div className="absolute -top-7 left-0 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded shadow-md whitespace-nowrap">
                  {activeDamage.panelLabel}: {activeDamage.type.replace('_', ' ')}
                </div>
              </div>
            )}
          </div>
        ) : frames.length > 0 ? (
          <div className="relative w-full h-full">
            <img
              src={frames[selectedFrameIndex]?.dataUrl}
              alt={`Keyframe #${selectedFrameIndex}`}
              className="w-full h-full object-contain"
            />

            {/* Damage Bounding Box on Keyframe */}
            {activeDamage && activeDamage.frame_index === selectedFrameIndex && (
              <div
                className="absolute border-2 border-red-500 bg-red-500/25 rounded pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                style={getBoxStyle(activeDamage.box_2d)}
              >
                <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded shadow-lg whitespace-nowrap">
                  <Crosshair className="w-3 h-3" />
                  <span>{activeDamage.panelLabel}</span>
                  <span className="opacity-80 text-[9px] uppercase font-normal">
                    ({Math.round(activeDamage.confidence * 100)}% conf)
                  </span>
                </div>
              </div>
            )}

            {/* Frame metadata tag */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur rounded text-[11px] font-mono text-slate-300">
              Frame #{selectedFrameIndex + 1}/{frames.length} • {frames[selectedFrameIndex]?.timestamp_seconds}s
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-sm flex flex-col items-center">
            <Eye className="w-8 h-8 mb-2 opacity-40" />
            No video playback source available
          </div>
        )}
      </div>

      {/* Scrubber & Controls */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800">
        {viewMode === 'video' && videoUrl ? (
          <div className="flex flex-col gap-2">
            {/* Timeline with damage ticks */}
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              {/* Damage timeline tick pins */}
              {damages.map((dmg) => {
                const leftPct = duration > 0 ? (dmg.timestamp_seconds / duration) * 100 : 0;
                const isSelected = dmg.id === selectedDamageId;
                return (
                  <button
                    key={dmg.id}
                    title={`${dmg.panelLabel}: ${dmg.description}`}
                    onClick={() => {
                      seekTo(dmg.timestamp_seconds);
                      if (onSelectDamage) onSelectDamage(dmg);
                    }}
                    style={{ left: `${Math.min(98, Math.max(2, leftPct))}%` }}
                    className={`absolute -top-1.5 w-3.5 h-3.5 -ml-1.5 rounded-full border-2 transition-transform ${
                      isSelected
                        ? 'bg-red-500 border-white scale-125 z-10'
                        : 'bg-amber-400 border-slate-900 hover:scale-110'
                    }`}
                  />
                );
              })}
            </div>

            {/* Play / Pause & Timestamp row */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => seekTo(0)}
                  className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-slate-300">
                  {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                {damages.length} damage {damages.length === 1 ? 'flag' : 'flags'} localized
              </div>
            </div>
          </div>
        ) : frames.length > 0 ? (
          /* Keyframe Stepper Controls */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                disabled={selectedFrameIndex === 0}
                onClick={() => setSelectedFrameIndex((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={selectedFrameIndex === frames.length - 1}
                onClick={() => setSelectedFrameIndex((prev) => Math.min(frames.length - 1, prev + 1))}
                className="p-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-300 font-mono ml-2">
                Frame {selectedFrameIndex + 1} of {frames.length} ({frames[selectedFrameIndex]?.timestamp_seconds}s)
              </span>
            </div>

            {/* Quick jump to damaged frames */}
            <div className="flex items-center gap-1">
              {damages.map((dmg, idx) => (
                <button
                  key={dmg.id}
                  onClick={() => {
                    setSelectedFrameIndex(dmg.frame_index < frames.length ? dmg.frame_index : 0);
                    if (onSelectDamage) onSelectDamage(dmg);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedDamageId === dmg.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Damage #{idx + 1}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
