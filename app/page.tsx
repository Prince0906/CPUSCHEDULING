'use client';

import { useSchedulerStore } from '@/lib/store';
import Header from '@/components/Header';
import ProcessForm from '@/components/ProcessForm';
import CPUCore from '@/components/CPUCore';
import ReadyQueue from '@/components/ReadyQueue';
import IOQueue from '@/components/IOQueue';
import CompletedProcesses from '@/components/CompletedProcesses';
import GanttChart from '@/components/GanttChart';
import Controls from '@/components/Controls';
import ProcessTable from '@/components/ProcessTable';
import Statistics from '@/components/Statistics';
import AlgorithmInfo from '@/components/AlgorithmInfo';
import CompareMode from '@/components/CompareMode';
import FlawAnalysis from '@/components/FlawAnalysis';

export default function Home() {
  const { isCompareMode } = useSchedulerStore();

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left sidebar */}
          <aside className="w-[340px] flex-shrink-0">
            <ProcessForm />
            {!isCompareMode && (
              <div className="mt-6">
                <AlgorithmInfo />
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {isCompareMode ? (
              <CompareMode />
            ) : (
              <>
                {/* Visualization row */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <CPUCore />
                  </div>
                  <div className="col-span-1">
                    <ReadyQueue />
                  </div>
                  <div className="col-span-1">
                    <IOQueue />
                  </div>
                </div>

                {/* Completed processes */}
                <CompletedProcesses />

                {/* Controls */}
                <Controls />

                {/* Gantt Chart */}
                <GanttChart />

                {/* Process Details Table */}
                <ProcessTable />

                {/* Statistics */}
                <Statistics />

                {/* AI Flaw Analysis */}
                <FlawAnalysis />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
