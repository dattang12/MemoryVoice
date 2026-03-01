'use client';

import { useRef, useCallback, useMemo } from 'react';
import type { MistakeEvent, TimelineSegment } from '@/lib/types';

interface MistakeTimelineProps {
  mistakes: MistakeEvent[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onSelectMistake: (mistake: MistakeEvent | null) => void;
  selectedMistakeId?: string | null;
}

export default function MistakeTimeline({
  mistakes,
  duration,
  currentTime,
  onSeek,
  onSelectMistake,
  selectedMistakeId,
}: MistakeTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Convert mistakes to timeline segments
  const segments = useMemo((): TimelineSegment[] => {
    if (duration <= 0) return [];

    return mistakes.map(event => ({
      id: event.id,
      startPercent: (event.startTimeSec / duration) * 100,
      widthPercent: Math.max(1, ((event.endTimeSec - event.startTimeSec) / duration) * 100),
      color: getSeverityColor(event.severity),
      event,
    }));
  }, [mistakes, duration]);

  // Calculate playhead position
  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle click on timeline
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    const time = (percent / 100) * duration;

    // Seek to clicked time
    onSeek(Math.max(0, Math.min(duration, time)));

    // Check if clicking on a segment
    const clickedSegment = segments.find(seg =>
      percent >= seg.startPercent && percent <= seg.startPercent + seg.widthPercent
    );

    if (clickedSegment) {
      onSelectMistake(clickedSegment.event);
    } else {
      onSelectMistake(null);
    }
  }, [duration, segments, onSeek, onSelectMistake]);

  // Handle segment click
  const handleSegmentClick = useCallback((e: React.MouseEvent, segment: TimelineSegment) => {
    e.stopPropagation();
    onSeek(segment.event.startTimeSec);
    onSelectMistake(segment.event);
  }, [onSeek, onSelectMistake]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if current time is within a mistake
  const currentMistake = useMemo(() => {
    return mistakes.find(m =>
      currentTime >= m.startTimeSec && currentTime <= m.endTimeSec
    );
  }, [mistakes, currentTime]);

  return (
    <div className="w-full space-y-2">
      {/* Timeline label */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Mistake Timeline</span>
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      {/* Timeline container */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative h-8 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors"
      >
        {/* Mistake segments */}
        {segments.map(segment => (
          <button
            key={segment.id}
            onClick={(e) => handleSegmentClick(e, segment)}
            className={`absolute top-0 bottom-0 rounded transition-all ${
              selectedMistakeId === segment.id
                ? 'ring-2 ring-white ring-offset-1 z-10'
                : 'hover:opacity-90'
            }`}
            style={{
              left: `${segment.startPercent}%`,
              width: `${segment.widthPercent}%`,
              backgroundColor: segment.color,
              minWidth: '4px',
            }}
            title={`${segment.event.summaryTitle} (${formatTime(segment.event.startTimeSec)})`}
          >
            {/* Show label if segment is wide enough */}
            {segment.widthPercent > 8 && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium truncate px-1">
                {segment.event.summaryTitle}
              </span>
            )}
          </button>
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
          style={{ left: `${playheadPercent}%` }}
        >
          {/* Playhead triangle */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
        </div>

        {/* Current time indicator */}
        {currentMistake && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Low</span>
        </div>
        <span className="ml-auto text-gray-400">Click to seek</span>
      </div>

      {/* Current mistake indicator */}
      {currentMistake && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-sm text-red-800 font-medium">
            {currentMistake.summaryTitle}
          </span>
          <span className="text-xs text-red-600 ml-auto">
            {Math.round(currentMistake.confidence * 100)}% confidence
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function for severity colors
function getSeverityColor(severity: number): string {
  if (severity >= 0.7) return '#ef4444'; // Red
  if (severity >= 0.4) return '#f97316'; // Orange
  return '#eab308'; // Yellow
}

// Mini version for embedding
export function MistakeTimelineMini({
  mistakes,
  duration,
  currentTime,
  onSeek,
}: {
  mistakes: MistakeEvent[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}) {
  const segments = useMemo((): TimelineSegment[] => {
    if (duration <= 0) return [];

    return mistakes.map(event => ({
      id: event.id,
      startPercent: (event.startTimeSec / duration) * 100,
      widthPercent: Math.max(0.5, ((event.endTimeSec - event.startTimeSec) / duration) * 100),
      color: getSeverityColor(event.severity),
      event,
    }));
  }, [mistakes, duration]);

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    onSeek(percent * duration);
  };

  return (
    <div
      onClick={handleClick}
      className="relative h-2 bg-gray-600 rounded-full overflow-hidden cursor-pointer"
    >
      {segments.map(segment => (
        <div
          key={segment.id}
          className="absolute top-0 bottom-0"
          style={{
            left: `${segment.startPercent}%`,
            width: `${segment.widthPercent}%`,
            backgroundColor: segment.color,
            minWidth: '2px',
          }}
        />
      ))}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white rounded-full"
        style={{ left: `calc(${playheadPercent}% - 2px)` }}
      />
    </div>
  );
}
