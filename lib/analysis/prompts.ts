import { SimulationDataForAnalysis } from './types';

export function buildAnalysisPrompt(data: SimulationDataForAnalysis): string {
  const processTable = data.processes.length > 0
    ? data.processes
      .map(p => `  - ${p.name}: arrival=${p.arrivalTime}ms, burst=${p.cpuBurstTime}ms, io=${p.ioBurstTime}ms, priority=${p.priority}, wait=${p.waitingTime}ms, turnaround=${p.turnaroundTime}ms, response=${p.responseTime ?? 'N/A'}ms`)
      .join('\n')
    : '  (No processes)';

  const ganttSummary = data.ganttSummary.length > 0
    ? data.ganttSummary
      .map(g => `  - ${g.processName}: ${g.startTime}-${g.endTime}ms${g.wasPreempted ? ' (preempted)' : ''}`)
      .join('\n')
    : '  (No execution recorded)';

  const quantumInfo = data.timeQuantum
    ? `Time Quantum: ${data.timeQuantum}ms\n`
    : '';

  return `You are a CPU scheduling algorithm expert. Analyze the following simulation results and identify any flaws or issues with the algorithm's performance.

## Algorithm Used
${data.algorithmName} (${data.algorithm})
${quantumInfo}
## Process Details
${processTable}

## Execution Timeline (Gantt Chart)
${ganttSummary}

## Statistics
- Average Waiting Time: ${data.statistics.avgWaitingTime.toFixed(2)}ms
- Average Turnaround Time: ${data.statistics.avgTurnaroundTime.toFixed(2)}ms
- Average Response Time: ${data.statistics.avgResponseTime.toFixed(2)}ms
- CPU Utilization: ${data.statistics.cpuUtilization.toFixed(1)}%
- Total Execution Time: ${data.statistics.totalTime}ms
- Context Switches: ${data.statistics.contextSwitches}

## Your Task
Analyze this simulation and identify any algorithmic flaws. Consider:
1. **Convoy Effect** (FCFS): Did a long process block shorter ones? Look for short processes waiting behind long ones.
2. **Starvation** (SJF/Priority/MLQ): Did any process wait excessively long (>2x average waiting time)?
3. **Excessive Context Switches** (RR/SRTF/MLFQ): More than N-1 switches for N processes suggests inefficiency.
4. **High Waiting Time**: Any process waiting >50% of total execution time is concerning.
5. **Priority Issues**: Lower priority process running before higher priority ones?
6. **Quantum Inefficiency** (RR/MLQ/MLFQ): Quantum too small = many switches; too large = behaves like FCFS.
7. **Queue Starvation** (MLQ): Lower-priority queues never get CPU time because higher queues are always busy.
8. **Unnecessary Demotion** (MLFQ): Processes that would finish quickly got demoted too aggressively.

Severity Guidelines:
- **high**: Major performance impact, affects >50% of processes
- **medium**: Moderate impact, affects some processes noticeably  
- **low**: Minor inefficiency, edge case

Respond with a JSON object in this exact format:
{
  "flaws": [
    {
      "type": "convoy|starvation|context_switches|high_waiting|priority_issue|quantum_inefficiency|queue_starvation|unnecessary_demotion",
      "severity": "low|medium|high",
      "affectedProcesses": ["P1", "P2"],
      "description": "Brief description of the flaw",
      "explanation": "Detailed explanation of why this happened and its impact",
      "recommendation": "What to do about it",
      "betterAlgorithms": ["sjf", "srtf"]
    }
  ],
  "overallAssessment": "Overall assessment of algorithm performance for this workload",
  "strengths": ["What the algorithm did well"],
  "recommendations": ["General recommendations for improvement"],
  "bestAlternative": {
    "algorithm": "sjf",
    "reason": "Why this would be better"
  }
}

Rules:
- Only include flaws that actually occurred based on the data
- Be specific about which processes were affected - use exact process names from the data (e.g., "P1", "P2")
- Algorithm types must be one of: fcfs, sjf, srtf, priority, priority-preemptive, rr, mlq, mlfq
- If no significant flaws, return empty flaws array but still provide assessment
- Keep descriptions concise but informative
- For affectedProcesses, only include process names that are actually in the simulation data`;
}

export const SYSTEM_PROMPT = `You are an expert in operating systems and CPU scheduling algorithms. You analyze simulation results to identify algorithmic flaws and provide actionable recommendations. Always respond with valid JSON only, no additional text.`;
