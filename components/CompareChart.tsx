'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS, ALGORITHM_COLORS } from '@/lib/types';
import { useState } from 'react';

export default function CompareChart() {
  const { compareResults } = useSchedulerStore();
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

  if (compareResults.length === 0) return null;

  const maxTime = Math.max(...compareResults.map(r => r.totalTime));
  const pixelsPerMs = 24;
  const chartWidth = Math.max(maxTime * pixelsPerMs, 300);

  return (
    <div className="card">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Timeline Comparison</h2>
        <span className="text-xs text-gray-400 font-medium tabular-nums">
          Total: {maxTime}ms
        </span>
      </div>

      <div className="p-6 overflow-x-auto">
        <div style={{ minWidth: `${chartWidth + 120}px` }}>
          {/* Time markers */}
          <div className="flex items-end mb-3 ml-28 h-5">
            {Array.from({ length: maxTime + 1 }, (_, i) => (
              <div key={i} className="flex-shrink-0" style={{ width: `${pixelsPerMs}px` }}>
                {i % 5 === 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">{i}</span>
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="space-y-4">
            {compareResults.map((result, resultIdx) => {
              const info = ALGORITHMS[result.algorithm];
              const algoColor = ALGORITHM_COLORS[result.algorithm];

              return (
                <motion.div
                  key={result.algorithm}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: resultIdx * 0.08 }}
                  className="flex items-center gap-4"
                >
                  {/* Label */}
                  <div className="w-24 flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: algoColor }}
                    />
                    <span className="text-sm font-semibold text-gray-700 truncate">{info.shortName}</span>
                  </div>

                  {/* Gantt bar */}
                  <div
                    className="relative h-9 bg-gray-50 rounded-lg border border-gray-100 flex-1"
                    style={{ minWidth: `${chartWidth}px` }}
                  >
                    {result.ganttChart.map((entry, idx) => {
                      const isIdle = entry.processId === null;
                      const width = (entry.endTime - entry.startTime) * pixelsPerMs;
                      const left = entry.startTime * pixelsPerMs;
                      const key = `${result.algorithm}-${idx}`;

                      return (
                        <motion.div
                          key={key}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: resultIdx * 0.08 + idx * 0.02 }}
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            width: `${width}px`,
                            top: '3px',
                            bottom: '3px',
                            backgroundColor: isIdle ? '#F3F4F6' : entry.color,
                            borderRadius: '4px',
                            border: isIdle ? '1px dashed #D1D5DB' : 'none',
                          }}
                          className="origin-left flex items-center justify-center cursor-default"
                          onMouseEnter={() => setHoveredEntry(key)}
                          onMouseLeave={() => setHoveredEntry(null)}
                        >
                          {width >= 24 && (
                            <span className={`text-[10px] font-semibold ${isIdle ? 'text-gray-400' : 'text-white'}`}>
                              {isIdle ? '—' : entry.processName}
                            </span>
                          )}

                          {hoveredEntry === key && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap z-20 shadow-lg">
                              <span className="font-semibold">{isIdle ? 'Idle' : entry.processName}</span>
                              <span className="text-gray-400 ml-1">
                                {entry.startTime}–{entry.endTime}ms
                              </span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Duration badge */}
                  <div className="w-14 text-right flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500 tabular-nums">{result.totalTime}ms</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
