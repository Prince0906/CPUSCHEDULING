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

  const pixelsPerMs = 32;
  const minWidth = Math.max(currentTime * pixelsPerMs, 400);

  return (
    <div className="card">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Timeline</h2>
        {currentTime > 0 && (
          <span className="text-sm text-gray-400">{currentTime}ms</span>
        )}
      </div>

      {ganttChart.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
          Start simulation to see timeline
        </div>
      ) : (
        <div ref={scrollRef} className="p-6 overflow-x-auto">
          <div style={{ minWidth: `${minWidth}px` }}>
            {/* Timeline */}
            <div className="relative h-12 bg-gray-50 rounded-lg overflow-hidden">
              {/* Time markers */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: currentTime + 1 }, (_, i) => (
                  <div 
                    key={i}
                    className="flex-shrink-0 border-l border-gray-100"
                    style={{ width: `${pixelsPerMs}px` }}
                  >
                    {i % 5 === 0 && (
                      <span className="absolute -top-5 text-[10px] text-gray-400 -translate-x-1/2">
                        {i}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Process bars */}
              <div className="absolute inset-y-1 left-0 flex">
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
                      className="gantt-bar origin-left relative"
                      onMouseEnter={() => setHoveredEntry(index)}
                      onMouseLeave={() => setHoveredEntry(null)}
                    >
                      {width >= 28 && (
                        <span className={`text-[11px] ${isIdle ? 'text-gray-500' : 'text-white'}`}>
                          {isIdle ? '—' : entry.processName}
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                          {entry.processName}: {entry.startTime}–{entry.endTime}ms
                        </div>
                      )}
                      
                      {/* Preemption indicator */}
                      {entry.isPreempted && (
                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-red-400" />
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
              />
            </div>

            {/* Time axis */}
            <div className="mt-2 text-center text-xs text-gray-400">
              Time (ms)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
