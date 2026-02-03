'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { useRef, useEffect, useState } from 'react';

export default function GanttChart() {
  const { ganttChart, currentTime } = useSchedulerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredEntry, setHoveredEntry] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [ganttChart]);

  const pixelsPerMs = 40;
  const minWidth = Math.max((currentTime + 1) * pixelsPerMs, 400);

  return (
    <div className="card">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Timeline</h2>
        {currentTime > 0 && (
          <span className="text-sm text-gray-400">Current: {currentTime}ms</span>
        )}
      </div>

      {ganttChart.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
          Start simulation to see timeline
        </div>
      ) : (
        <div ref={scrollRef} className="p-6 pt-2 overflow-x-auto">
          <div style={{ minWidth: `${minWidth}px` }}>
            {/* Time scale header */}
            <div className="relative h-6 mb-1">
              {Array.from({ length: currentTime + 2 }, (_, i) => (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${i * pixelsPerMs}px`, transform: 'translateX(-50%)' }}
                >
                  <span className={`text-[10px] tabular-nums ${i === currentTime ? 'text-sky-600 font-semibold' : 'text-gray-500'}`}>
                    {i}
                  </span>
                </div>
              ))}
            </div>

            {/* Timeline with grid */}
            <div className="relative h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              {/* Grid lines */}
              <div className="absolute inset-0">
                {Array.from({ length: currentTime + 2 }, (_, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 ${i % 5 === 0 ? 'border-l border-gray-200' : 'border-l border-gray-100'}`}
                    style={{ left: `${i * pixelsPerMs}px` }}
                  />
                ))}
              </div>

              {/* Process bars */}
              <div className="absolute inset-y-1.5 left-0">
                {ganttChart.map((entry, index) => {
                  const isIdle = entry.processId === null;
                  const width = (entry.endTime - entry.startTime) * pixelsPerMs;
                  const left = entry.startTime * pixelsPerMs;
                  const isHovered = hoveredEntry === index;
                  
                  return (
                    <motion.div
                      key={`${entry.processId}-${entry.startTime}`}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      style={{
                        position: 'absolute',
                        left: `${left}px`,
                        width: `${width}px`,
                        backgroundColor: isIdle ? '#E5E7EB' : entry.color,
                      }}
                      className="gantt-bar origin-left relative cursor-pointer"
                      onMouseEnter={() => setHoveredEntry(index)}
                      onMouseLeave={() => setHoveredEntry(null)}
                    >
                      {width >= 32 && (
                        <span className={`text-[11px] font-medium ${isIdle ? 'text-gray-500' : 'text-white'}`}>
                          {isIdle ? '—' : entry.processName}
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                          <div className="font-medium">{entry.processName}</div>
                          <div className="text-gray-300 mt-0.5">
                            {entry.startTime}ms → {entry.endTime}ms ({entry.endTime - entry.startTime}ms)
                          </div>
                          {entry.isPreempted && (
                            <div className="text-amber-400 mt-0.5">⚡ Preempted</div>
                          )}
                        </div>
                      )}
                      
                      {/* Preemption indicator */}
                      {entry.isPreempted && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-400" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Current time marker */}
              <motion.div
                className="absolute top-0 bottom-0 w-0.5 bg-sky-500 z-10"
                animate={{ left: `${currentTime * pixelsPerMs}px` }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-sky-500 rounded-full" />
              </motion.div>
            </div>

            {/* Bottom scale with tick marks */}
            <div className="relative h-4 mt-1">
              {Array.from({ length: currentTime + 2 }, (_, i) => (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${i * pixelsPerMs}px` }}
                >
                  <div className={`w-px ${i % 5 === 0 ? 'h-2 bg-gray-400' : 'h-1 bg-gray-300'}`} />
                </div>
              ))}
            </div>

            {/* Time axis label */}
            <div className="mt-1 text-center text-xs text-gray-400">
              Time (ms)
            </div>

            {/* Legend */}
            {ganttChart.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-sky-500 rounded-full" />
                  <span className="text-gray-500">Current time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded" />
                  <span className="text-gray-500">CPU Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-red-400 rounded" />
                  <span className="text-gray-500">Preempted</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
