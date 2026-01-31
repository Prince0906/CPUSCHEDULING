'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { calculateStatistics } from '@/lib/utils';

export default function Statistics() {
  const { processes, currentTime, ganttChart, completedProcesses } = useSchedulerStore();
  
  const stats = calculateStatistics(processes, currentTime, ganttChart);
  const hasData = completedProcesses.length > 0;

  const metrics = [
    { label: 'Avg Wait', value: stats.avgWaitingTime, unit: 'ms' },
    { label: 'Avg Turnaround', value: stats.avgTurnaroundTime, unit: 'ms' },
    { label: 'Avg Response', value: stats.avgResponseTime, unit: 'ms' },
    { label: 'CPU Usage', value: stats.cpuUtilization, unit: '%' },
  ];

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">Statistics</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">
                {hasData ? metric.value.toFixed(1) : '—'}
                {hasData && <span className="text-sm text-gray-400 ml-0.5">{metric.unit}</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
