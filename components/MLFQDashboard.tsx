'use client';

import { useSchedulerStore } from '@/lib/store';
import MLFQQueueStack from './MLFQQueueStack';
import MLFQGanttChart from './MLFQGanttChart';
import MLFQStats from './MLFQStats';
import MLFQBoostTimer from './MLFQBoostTimer';

export default function MLFQDashboard() {
    const { mlfqSimState } = useSchedulerStore();

    return (
        <div className="space-y-4">
            {/* Priority Boost countdown — always visible */}
            <MLFQBoostTimer />

            {/* Main visualization: 3 queue lanes + CPU/IO columns */}
            <MLFQQueueStack />

            {/* Gantt — only once simulation has started */}
            {mlfqSimState && mlfqSimState.ganttChart.length > 0 && (
                <MLFQGanttChart />
            )}

            {/* Stats — only once simulation has started */}
            {mlfqSimState && (
                <MLFQStats />
            )}
        </div>
    );
}
