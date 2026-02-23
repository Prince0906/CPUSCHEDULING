'use client';

import { motion } from 'framer-motion';
import { Play, BarChart3, Settings2 } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { AlgorithmType, ALGORITHMS, ALGORITHM_COLORS } from '@/lib/types';
import CompareChart from './CompareChart';
import CompareSummary from './CompareSummary';

const allAlgorithms: AlgorithmType[] = ['fcfs', 'sjf', 'srtf', 'priority', 'priority-preemptive', 'priority-aging', 'rr'];

export default function CompareMode() {
  const {
    compareAlgorithms,
    setCompareAlgorithms,
    compareResults,
    runComparison,
    processes,
    timeQuantum,
    setTimeQuantum,
    agingTime,
    setAgingTime,
  } = useSchedulerStore();

  const toggleAlgorithm = (algo: AlgorithmType) => {
    if (compareAlgorithms.includes(algo)) {
      if (compareAlgorithms.length > 1) {
        setCompareAlgorithms(compareAlgorithms.filter(a => a !== algo));
      }
    } else {
      setCompareAlgorithms([...compareAlgorithms, algo]);
    }
  };

  const selectAll = () => setCompareAlgorithms([...allAlgorithms]);
  const clearAll = () => setCompareAlgorithms([allAlgorithms[0]]);

  const hasProcesses = processes.length > 0;
  const hasResults = compareResults.length > 0;
  const needsRR = compareAlgorithms.includes('rr');
  const needsAging = compareAlgorithms.includes('priority-aging');

  return (
    <div className="space-y-6">
      {/* Algorithm Selection Card */}
      <div className="card">
        <div className="section-header flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            Compare Algorithms
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-sky-600 font-medium hover:text-sky-700 transition-colors px-2 py-1 rounded hover:bg-sky-50"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 font-medium hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Algorithm chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allAlgorithms.map((algo) => {
              const info = ALGORITHMS[algo];
              const color = ALGORITHM_COLORS[algo];
              const isSelected = compareAlgorithms.includes(algo);

              return (
                <motion.button
                  key={algo}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleAlgorithm(algo)}
                  className="relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: isSelected ? color : '#E5E7EB',
                    backgroundColor: isSelected ? `${color}08` : '#FAFAFA',
                  }}
                >
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: isSelected ? color : '#D1D5DB',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{info.shortName}</div>
                    <div className="text-[10px] text-gray-400 truncate">{info.name}</div>
                  </div>
                  {/* Checkmark */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Configuration row */}
          {(needsRR || needsAging) && (
            <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400">
                <Settings2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Config</span>
              </div>

              {needsRR && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">Time Quantum (RR)</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={timeQuantum}
                    onChange={(e) => setTimeQuantum(parseInt(e.target.value))}
                    className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-gray-700 w-8 tabular-nums">{timeQuantum}ms</span>
                </div>
              )}

              {needsAging && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 font-medium">Aging Interval</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={agingTime}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= 1) setAgingTime(v);
                    }}
                    className="w-16 px-2 py-1 text-sm font-bold text-rose-600 bg-white border border-gray-200 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <span className="text-sm text-gray-500">ms</span>
                </div>
              )}
            </div>
          )}

          {/* Run button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={runComparison}
            disabled={!hasProcesses || compareAlgorithms.length < 2}
            className="btn btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {!hasProcesses
              ? 'Add processes first'
              : compareAlgorithms.length < 2
                ? 'Select at least 2 algorithms'
                : `Compare ${compareAlgorithms.length} Algorithms`
            }
          </motion.button>
        </div>
      </div>

      {/* Results */}
      {hasResults && (
        <>
          <CompareChart />
          <CompareSummary />
        </>
      )}
    </div>
  );
}
