'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS, ALGORITHM_COLORS } from '@/lib/types';
import { Trophy } from 'lucide-react';

export default function CompareSummary() {
  const { compareResults } = useSchedulerStore();

  if (compareResults.length === 0) return null;

  // Find best values
  const metrics = ['avgWaitingTime', 'avgTurnaroundTime', 'avgResponseTime', 'cpuUtilization'] as const;
  const metricLabels: Record<string, string> = {
    avgWaitingTime: 'Avg Wait',
    avgTurnaroundTime: 'Avg Turnaround',
    avgResponseTime: 'Avg Response',
    cpuUtilization: 'CPU Utilization',
  };

  const bestValues: Record<string, string> = {};

  metrics.forEach(metric => {
    const isHigherBetter = metric === 'cpuUtilization';
    let bestValue = isHigherBetter ? -Infinity : Infinity;
    let bestAlgo = '';

    compareResults.forEach(result => {
      const value = result.statistics[metric];
      if (isHigherBetter ? value > bestValue : value < bestValue) {
        bestValue = value;
        bestAlgo = result.algorithm;
      }
    });

    bestValues[metric] = bestAlgo;
  });

  // Count wins per algorithm
  const winCount: Record<string, number> = {};
  compareResults.forEach(r => { winCount[r.algorithm] = 0; });
  Object.values(bestValues).forEach(algo => {
    if (algo) winCount[algo] = (winCount[algo] || 0) + 1;
  });

  // Sort by win count descending
  const sortedResults = [...compareResults].sort(
    (a, b) => (winCount[b.algorithm] || 0) - (winCount[a.algorithm] || 0)
  );

  return (
    <div className="card">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          Results
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          {compareResults.length} algorithms compared
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Algorithm</th>
              {metrics.map(m => (
                <th key={m} className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {metricLabels[m]}
                </th>
              ))}
              <th className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wins</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const info = ALGORITHMS[result.algorithm];
              const color = ALGORITHM_COLORS[result.algorithm];
              const wins = winCount[result.algorithm] || 0;

              return (
                <motion.tr
                  key={result.algorithm}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${index === 0 ? 'bg-amber-50/30' : ''}`}
                >
                  {/* Rank */}
                  <td className="py-4 px-6">
                    {index === 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        1
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium pl-1.5">{index + 1}</span>
                    )}
                  </td>

                  {/* Algorithm name with color */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-gray-900">{info.shortName}</span>
                    </div>
                  </td>

                  {/* Metric cells */}
                  {metrics.map(metric => {
                    const value = result.statistics[metric];
                    const isBest = bestValues[metric] === result.algorithm;
                    const unit = metric === 'cpuUtilization' ? '%' : 'ms';
                    return (
                      <td key={metric} className="text-center py-4 px-4">
                        <span
                          className={`tabular-nums inline-flex items-center gap-1 ${isBest
                            ? 'text-emerald-600 font-bold'
                            : 'text-gray-600'
                            }`}
                        >
                          {isBest && (
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {value.toFixed(1)}{unit}
                        </span>
                      </td>
                    );
                  })}

                  {/* Wins count */}
                  <td className="text-center py-4 px-4">
                    {wins > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        {wins}/{metrics.length}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
