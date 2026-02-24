import { SimulationDataForAnalysis } from './types';

export function buildAnalysisPrompt(data: SimulationDataForAnalysis): string {
  const processTable = data.processes.length > 0
    ? data.processes
      .map(p => `  - ${p.name}: arrival=${p.arrivalTime}ms, burst=${p.cpuBurstTime}ms, io=${p.ioBurstTime}ms, priority=${p.priority}${p.queueLevel !== undefined ? `, queue=${p.queueLevel}` : ''}, wait=${p.waitingTime}ms, turnaround=${p.turnaroundTime}ms, response=${p.responseTime ?? 'N/A'}ms`)
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

  // Build MLQ/MLFQ-specific context block if available
  let mlqSection = '';
  if (data.mlqContext) {
    const ctx = data.mlqContext;
    const queueTable = ctx.queueConfigs
      .map(q => `  - Q${q.id} (${q.label}): algorithm=${q.algorithm}, quantum=${q.timeQuantum}ms`)
      .join('\n');
    const perQueueTable = ctx.perQueueStats
      .map(q => `  - Q${q.queueId} (${q.label}): ${q.processCount} processes, avg wait=${q.avgWaitingTime.toFixed(2)}ms`)
      .join('\n');
    mlqSection = `\n## Queue Configuration\n${queueTable}\n\n## Per-Queue Statistics\n${perQueueTable}\n`;
    if (ctx.contextSwitchCount !== undefined) {
      mlqSection += `- Queue-level Context Switches: ${ctx.contextSwitchCount}\n`;
    }
    if (ctx.boostTimerLimit !== undefined) {
      mlqSection += `- MLFQ Boost Timer Interval: every ${ctx.boostTimerLimit} ticks\n`;
    }
    if (ctx.totalBoosts !== undefined) {
      mlqSection += `- Total Priority Boosts During Simulation: ${ctx.totalBoosts}\n`;
    }
  }

  return `You are a CPU scheduling algorithm expert. Analyze the following simulation results and identify any flaws or issues with the algorithm's performance.

## Algorithm Used
${data.algorithmName} (${data.algorithm})
${quantumInfo}${mlqSection}
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
2. **Starvation** (SJF/Priority): Did any process wait excessively long (>2x average waiting time)?
3. **Excessive Context Switches** (RR/SRTF): More than N-1 switches for N processes suggests inefficiency.
4. **High Waiting Time**: Any process waiting >50% of total execution time is concerning.
5. **Priority Issues**: Lower priority process running before higher priority ones?
6. **Quantum Inefficiency** (RR): Quantum too small = many switches; too large = behaves like FCFS.
7. **Queue Starvation** (MLQ/MLFQ): Lower-priority queues get no or very little CPU time because higher-priority queues dominate. Compare per-queue average waiting times.
8. **Excessive Demotion** (MLFQ): Most or all processes end up demoted to the lowest-priority queue, making MLFQ behave like a single FCFS queue.
9. **Boost Dependency** (MLFQ): The only reason lower-queue processes get CPU time is the periodic priority boost. Without it, they would starve. Check if boost timer is the sole fairness mechanism.

7. **MLQ Specific**: If the algorithm is MLQ, queue levels are: 0=System (highest priority), 1=Interactive, 2=Batch, 3=Background (lowest). Analyze if higher queues starve lower ones unnecessarily.

Severity Guidelines:
- **high**: Major performance impact, affects >50% of processes or queue starvation with 0 CPU time
- **medium**: Moderate impact, affects some processes noticeably or significant waiting time disparity between queues
- **low**: Minor inefficiency, edge case

Respond with a JSON object in this exact format:
{
  "flaws": [
    {
      "type": "convoy|starvation|context_switches|high_waiting|priority_issue|quantum_inefficiency|queue_starvation|demotion_heavy|boost_dependency",
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
  "suggestedAlternatives": ["sjf", "rr"]
}

Rules:
- Do NOT recommend a single perfect algorithm. Instead, suggest 1–3 alternatives in suggestedAlternatives that would handle this specific workload differently or better, focusing on mitigating the identified flaws. Leave the array empty only if the current algorithm is genuinely optimal.
- Only include flaws that actually occurred based on the data
- Be specific about which processes were affected - use exact process names from the data (e.g., "P1", "P2")
- Algorithm types must be one of: fcfs, sjf, srtf, priority, priority-preemptive, rr, mlq, mlfq
- If no significant flaws, return empty flaws array but still provide assessment
- Keep descriptions concise but informative
- For affectedProcesses, only include process names that are actually in the simulation data`;
}

export const SYSTEM_PROMPT = `You are an expert in operating systems and CPU scheduling algorithms. You analyze simulation results to identify algorithmic flaws and provide actionable recommendations. Always respond with valid JSON only, no additional text.`;
