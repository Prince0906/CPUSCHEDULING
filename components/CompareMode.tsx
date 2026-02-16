'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { AlgorithmType, ALGORITHMS } from '@/lib/types';
import CompareChart from './CompareChart';
import CompareSummary from './CompareSummary';

const allAlgorithms: AlgorithmType[] = ['fcfs', 'sjf', 'srtf', 'priority', 'priority-preemptive', 'rr', 'mlq', 'mlfq'];

export default function CompareMode() {
  const {
    compareAlgorithms,
    setCompareAlgorithms,
    compareResults,
    runComparison,
    processes,
    timeQuantum,
    setTimeQuantum,
  } = useSchedulerStore();

  const toggleAlgorithm = (algo: AlgorithmType) => {
    if (compareAlgorithms.includes(algo)) {
      if (compareAlgorithms.length > 1) {
        setCompareAlgorithms(compareAlgorithms.filter(a => a !== algo));
      }
    } else {
      if (compareAlgorithms.length < 4) {
        setCompareAlgorithms([...compareAlgorithms, algo]);
      }
    }
  };

  const hasProcesses = processes.length > 0;
  const hasResults = compareResults.length > 0;

  return (
    <div className="space-y-6">
      {/* Selection */}
      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Select Algorithms</h2>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {allAlgorithms.map((algo) => {
              const info = ALGORITHMS[algo];
              const isSelected = compareAlgorithms.includes(algo);

              return (
                <button
                  key={algo}
                  onClick={() => toggleAlgorithm(algo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {info.shortName}
                </button>
              );
            })}
          </div>

          {/* Quantum setting */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-500">Time Quantum (RR):</span>
            <input
              type="range"
              min="1"
              max="10"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(parseInt(e.target.value))}
              className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-sm font-medium text-gray-700">{timeQuantum}ms</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={runComparison}
            disabled={!hasProcesses || compareAlgorithms.length < 2}
            className="btn btn-primary w-full py-3 text-sm"
          >
            <Play className="w-4 h-4 mr-2" />
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
