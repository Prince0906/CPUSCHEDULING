import { createInitialMlfqState, mlfqTick } from './lib/schedulers/mlfq';
import { getMlfqExampleProcesses, createProcess } from './lib/utils';
import { DEFAULT_MLFQ_QUEUES } from './lib/types';

const rawProcesses = getMlfqExampleProcesses();
const processes = rawProcesses.map((p, i) => createProcess(p, i));
let state = createInitialMlfqState(processes, 20);

console.log('--- Initial State ---');
console.log('Processes arriving at 0:', state.processes.filter(p => p.arrivalTime === 0).map(p => p.name));

for (let i = 0; i < 60; i++) {
    if (state.isComplete) break;
    state = mlfqTick(state, DEFAULT_MLFQ_QUEUES as any, 20);
    const runningName = state.runningProcess ? state.processes.find(p => p.id === state.runningProcess)?.name : 'Idle';
    const q0Names = state.queues[0].map(id => state.processes.find(p => p.id === id)?.name);
    const q1Names = state.queues[1].map(id => state.processes.find(p => p.id === id)?.name);
    const q2Names = state.queues[2].map(id => state.processes.find(p => p.id === id)?.name);
    const ioNames = state.ioQueue.map(id => state.processes.find(p => p.id === id)?.name);

    console.log(`Time ${state.currentTime}: CPU=${runningName} | Q0=[${q0Names}] Q1=[${q1Names}] Q2=[${q2Names}] | IO=[${ioNames}] | Boost=${state.boostTimeRemaining}`);
}
console.log('--- Final Status ---');
console.log('Complete:', state.isComplete);
