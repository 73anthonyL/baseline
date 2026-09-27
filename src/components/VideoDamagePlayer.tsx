import React, { useRef, useState, useEffect } from 'react';
import { DamageItem, VideoFrame } from '../types';
import { Play, Pause, RotateCcw, Crosshair, ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoDamagePlayerProps {
  videoUrl?: string;
  frames?: VideoFrame[];
  damages: DamageItem[];
  selectedDamageId?: string;
  seekTimestamp?: number;
  onSelectDamage?: (damage: DamageItem) => void;
  title?: string;
  badgeText?: string;
}

export const VideoDamagePlayer: React.FC<VideoDamagePlayerProps> = ({
  videoUrl,
  frames = [],
  damages,
  selectedDamageId,
  seekTimestamp,
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

  // Sync viewMode if videoUrl changes
  useEffect(() => {
    if (videoUrl) {
      setViewMode('video');
    }
  }, [videoUrl]);

  // Sync external seekTimestamp (e.g. from selecting a vehicle panel or frame)
  useEffect(() => {
    if (typeof seekTimestamp === 'number' && seekTimestamp >= 0) {
      seekTo(seekTimestamp);
    }
  }, [seekTimestamp]);

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
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Auto-sync frame index to current time
      if (frames.length > 0) {
        const closestIdx = frames.reduce((prevIdx, curr, currIdx) => {
          return Math.abs(curr.timestamp_seconds - time) < Math.abs(frames[prevIdx].timestamp_seconds - time)
            ? currIdx
            : prevIdx;
        }, 0);
        setSelectedFrameIndex(closestIdx);
      }
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
    if (frames.length > 0) {
      const closestIdx = frames.reduce((prevIdx, curr, currIdx) => {
        return Math.abs(curr.timestamp_seconds - sec) < Math.abs(frames[prevIdx].timestamp_seconds - sec)
          ? currIdx
          : prevIdx;
      }, 0);
      setSelectedFrameIndex(closestIdx);
    }
  };

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
    <div className="flex flex-col bg-neutral-950 border border-neutral-900 font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-900 bg-black">
        <div className="flex items-center gap-2">
          {title && <span className="font-semibold text-white">{title}</span>}
          {badgeText && (
            <span className="px-1.5 py-0.5 text-[10px] uppercase bg-neutral-900 text-neutral-300 border border-neutral-800">
              {badgeText}
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-neutral-800 text-[11px]">
          {videoUrl && (
            <button
              onClick={() => setViewMode('video')}
              className={`px-2.5 py-0.5 transition-colors ${
                viewMode === 'video' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Watch Video
            </button>
          )}
          <button
            onClick={() => setViewMode('keyframes')}
            className={`px-2.5 py-0.5 transition-colors ${
              viewMode === 'keyframes' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Keyframes ({frames.length})
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {viewMode === 'video' && videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
              onClick={togglePlay}
            />

            {/* Damage Overlay */}
            {activeDamage && Math.abs(currentTime - activeDamage.timestamp_seconds) < 2.0 && (
              <div
                className="absolute border border-white bg-white/10 pointer-events-none"
                style={getBoxStyle(activeDamage.box_2d)}
              >
                <div className="absolute -top-5 left-0 px-1 py-0.5 bg-black text-white text-[9px] uppercase border border-neutral-700 whitespace-nowrap">
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

            {/* Damage Overlay */}
            {activeDamage && activeDamage.frame_index === selectedFrameIndex && (
              <div
                className="absolute border border-white bg-white/10 pointer-events-none"
                style={getBoxStyle(activeDamage.box_2d)}
              >
                <div className="absolute -top-5 left-0 flex items-center gap-1 px-1.5 py-0.5 bg-black text-white text-[9px] uppercase border border-neutral-700 whitespace-nowrap">
                  <Crosshair className="w-2.5 h-2.5" />
                  <span>{activeDamage.panelLabel}</span>
                  <span className="text-neutral-500">
                    ({Math.round(activeDamage.confidence * 100)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 border border-neutral-800 text-[10px] text-neutral-400">
              Frame #{selectedFrameIndex + 1}/{frames.length} • {frames[selectedFrameIndex]?.timestamp_seconds}s
            </div>
          </div>
        ) : (
          <div className="text-neutral-600 text-xs font-mono">
            No video playback source available
          </div>
        )}
      </div>

      {/* Scrubber & Controls */}
      <div className="p-2.5 bg-black border-t border-neutral-900 space-y-2">
        {viewMode === 'video' && videoUrl ? (
          <div className="space-y-1.5">
            {/* Range Scrubber */}
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.05"
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 appearance-none cursor-pointer accent-white"
              />

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
                    className={`absolute -top-1 w-2.5 h-2.5 -ml-1 border transition-transform ${
                      isSelected
                        ? 'bg-white border-neutral-400 scale-125 z-10'
                        : 'bg-neutral-500 border-black hover:scale-110'
                    }`}
                  />
                );
              })}
            </div>

            {/* Play Button & Time Display */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="px-2 py-0.5 border border-neutral-800 hover:border-neutral-600 text-white transition-colors"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={() => seekTo(0)}
                  className="px-2 py-0.5 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white transition-colors"
                >
                  Rewind
                </button>
              </div>

              <div>
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </div>
            </div>
          </div>
        ) : (
          /* Keyframe Stepper Controls */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <button
                disabled={selectedFrameIndex === 0}
                onClick={() => setSelectedFrameIndex(Math.max(0, selectedFrameIndex - 1))}
                className="px-2 py-0.5 border border-neutral-800 hover:border-neutral-600 disabled:opacity-30 text-white"
              >
                ← Prev Frame
              </button>

              <span className="text-neutral-400">
                Frame {selectedFrameIndex + 1} of {frames.length} ({frames[selectedFrameIndex]?.timestamp_seconds}s)
              </span>

              <button
                disabled={selectedFrameIndex >= frames.length - 1}
                onClick={() => setSelectedFrameIndex(Math.min(frames.length - 1, selectedFrameIndex + 1))}
                className="px-2 py-0.5 border border-neutral-800 hover:border-neutral-600 disabled:opacity-30 text-white"
              >
                Next Frame →
              </button>
            </div>

            {/* Thumbnail Filmstrip */}
            {frames.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {frames.map((f, i) => {
                  const hasDamage = damages.some((d) => d.frame_index === i);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedFrameIndex(i)}
                      className={`relative shrink-0 w-12 h-8 border overflow-hidden transition-all ${
                        selectedFrameIndex === i
                          ? 'border-white'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={f.dataUrl} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                      {hasDamage && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
