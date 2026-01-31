'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS } from '@/lib/types';
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
      <div className="section-header">
        <h2 className="section-title">Timeline Comparison</h2>
      </div>

      <div className="p-6 overflow-x-auto">
        <div style={{ minWidth: `${chartWidth + 80}px` }}>
          {/* Time markers */}
          <div className="flex items-end mb-2 ml-20 h-4">
            {Array.from({ length: maxTime + 1 }, (_, i) => (
              <div key={i} className="flex-shrink-0" style={{ width: `${pixelsPerMs}px` }}>
                {i % 5 === 0 && (
                  <span className="text-[10px] text-gray-400">{i}</span>
                )}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="space-y-3">
            {compareResults.map((result) => {
              const info = ALGORITHMS[result.algorithm];
              
              return (
                <div key={result.algorithm} className="flex items-center gap-3">
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium text-gray-700">{info.shortName}</span>
                  </div>
                  
                  <div 
                    className="relative h-8 bg-gray-50 rounded flex-1"
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
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            width: `${width}px`,
                            top: '2px',
                            bottom: '2px',
                            backgroundColor: isIdle ? '#E5E7EB' : entry.color,
                            borderRadius: '3px',
                          }}
                          className="origin-left flex items-center justify-center"
                          onMouseEnter={() => setHoveredEntry(key)}
                          onMouseLeave={() => setHoveredEntry(null)}
                        >
                          {width >= 20 && (
                            <span className={`text-[10px] ${isIdle ? 'text-gray-500' : 'text-white'}`}>
                              {isIdle ? '' : entry.processName}
                            </span>
                          )}
                          
                          {hoveredEntry === key && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap z-10">
                              {entry.processName}: {entry.startTime}–{entry.endTime}ms
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
