'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS } from '@/lib/types';

export default function CompareSummary() {
  const { compareResults } = useSchedulerStore();

  if (compareResults.length === 0) return null;

  // Find best values
  const metrics = ['avgWaitingTime', 'avgTurnaroundTime', 'avgResponseTime', 'cpuUtilization'] as const;
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

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Results</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase">Algorithm</th>
              <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase">Wait</th>
              <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase">Turnaround</th>
              <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase">Response</th>
              <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 uppercase">CPU</th>
            </tr>
          </thead>
          <tbody>
            {compareResults.map((result, index) => {
              const info = ALGORITHMS[result.algorithm];
              
              return (
                <motion.tr
                  key={result.algorithm}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-50"
                >
                  <td className="py-4 px-6 font-medium text-gray-900">{info.shortName}</td>
                  <Cell 
                    value={result.statistics.avgWaitingTime} 
                    unit="ms" 
                    isBest={bestValues.avgWaitingTime === result.algorithm} 
                  />
                  <Cell 
                    value={result.statistics.avgTurnaroundTime} 
                    unit="ms" 
                    isBest={bestValues.avgTurnaroundTime === result.algorithm} 
                  />
                  <Cell 
                    value={result.statistics.avgResponseTime} 
                    unit="ms" 
                    isBest={bestValues.avgResponseTime === result.algorithm} 
                  />
                  <Cell 
                    value={result.statistics.cpuUtilization} 
                    unit="%" 
                    isBest={bestValues.cpuUtilization === result.algorithm} 
                  />
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ value, unit, isBest }: { value: number; unit: string; isBest: boolean }) {
  return (
    <td className={`text-center py-4 px-4 tabular-nums ${isBest ? 'text-emerald-600 font-semibold' : 'text-gray-600'}`}>
      {value.toFixed(1)}{unit}
    </td>
  );
}
