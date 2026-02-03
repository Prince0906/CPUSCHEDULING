import { AnalysisResult, SimulationDataForAnalysis, FlawDetection, FlawType, FlawSeverity } from './types';
import { buildAnalysisPrompt, SYSTEM_PROMPT } from './prompts';
import { AlgorithmType, ALGORITHMS } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const STORAGE_KEY = 'openai_api_key';

// Track if env key is available (cached after first check)
let envKeyAvailable: boolean | null = null;

// API Key Management - User's personal key in localStorage
export function getUserApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, key);
}

export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Check if we have any API key available (env or user)
export function hasApiKey(): boolean {
  // If env key is available, we always have a key
  if (envKeyAvailable === true) return true;
  // If env key check is pending or unavailable, check user key
  return !!getUserApiKey();
}

// Check if user has their own key configured
export function hasUserApiKey(): boolean {
  return !!getUserApiKey();
}

// Check if env key is available (for UI display)
export function isEnvKeyAvailable(): boolean {
  return envKeyAvailable === true;
}

// Get the actual env key status including unknown state
// Returns: true = available, false = unavailable, null = unknown (not checked yet)
export function getEnvKeyStatus(): boolean | null {
  return envKeyAvailable;
}

// Validate API key format (basic check)
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('sk-') && key.length > 20;
}

// Legacy alias for backward compatibility
export function getApiKey(): string | null {
  return getUserApiKey();
}

// Custom error class to distinguish server errors from network errors
class ServerAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerAnalysisError';
  }
}

// Main analysis function - tries env key first, falls back to user key
export async function analyzeSimulation(
  data: SimulationDataForAnalysis
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(data);
  
  // Track if we should try user key as fallback
  let shouldTryUserKey = false;
  
  // First, try using the server-side API route (uses env variable)
  try {
    const serverResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: prompt,
      }),
    });

    if (serverResponse.ok) {
      // Env key worked!
      envKeyAvailable = true;
      const result = await serverResponse.json();
      const parsed = parseAnalysisResponse(result.content);
      return {
        ...parsed,
        algorithm: data.algorithm,
        algorithmName: data.algorithmName,
      };
    }

    // Handle different server responses
    if (serverResponse.status === 404) {
      const errorData = await serverResponse.json().catch(() => ({}));
      if (errorData.error === 'NO_ENV_KEY') {
        // Server confirmed no env key configured - try user key
        envKeyAvailable = false;
        shouldTryUserKey = true;
      } else {
        // Unexpected 404 - still try user key
        envKeyAvailable = false;
        shouldTryUserKey = true;
      }
    } else if (serverResponse.status === 401) {
      // Invalid env key - mark as unavailable and try user key
      envKeyAvailable = false;
      shouldTryUserKey = true;
    } else {
      // Other server errors (429 rate limit, 500 server error, etc.)
      // These are real errors - don't modify envKeyAvailable, just report the error
      const errorData = await serverResponse.json().catch(() => ({}));
      throw new ServerAnalysisError(errorData.error || 'Analysis failed. Please try again.');
    }
  } catch (error) {
    // Distinguish between our intentional ServerAnalysisError and network/fetch errors
    if (error instanceof ServerAnalysisError) {
      // This is a real server error - propagate it
      throw error;
    }
    
    // Network error or fetch failure - try user key as fallback
    // Don't modify envKeyAvailable since we couldn't reach the server
    console.log('Server API unavailable, trying user key...', error);
    shouldTryUserKey = true;
  }
  
  // If we shouldn't try user key, something went wrong in the logic above
  if (!shouldTryUserKey) {
    throw new Error('Analysis failed. Please try again.');
  }

  // Fall back to user's API key
  const userApiKey = getUserApiKey();
  
  if (!userApiKey) {
    throw new Error('Please configure your OpenAI API key to use AI analysis.');
  }

  // Call OpenAI directly with user's key
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      }
      
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = parseAnalysisResponse(content);
    
    return {
      ...parsed,
      algorithm: data.algorithm,
      algorithmName: data.algorithmName,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to analyze simulation. Please try again.');
  }
}

// Parse and validate the LLM response
function parseAnalysisResponse(
  content: string
): Omit<AnalysisResult, 'algorithm' | 'algorithmName'> {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and transform flaws
    const flaws: FlawDetection[] = (parsed.flaws || []).map((flaw: Record<string, unknown>) => ({
      type: validateFlawType(flaw.type as string),
      severity: validateSeverity(flaw.severity as string),
      affectedProcesses: Array.isArray(flaw.affectedProcesses) 
        ? flaw.affectedProcesses
            .filter(p => p != null) // Filter out null and undefined before converting
            .map(String)
            .filter(s => s && s !== 'undefined' && s !== 'null' && s.trim() !== '') 
        : [],
      description: String(flaw.description || ''),
      explanation: String(flaw.explanation || ''),
      recommendation: String(flaw.recommendation || ''),
      betterAlgorithms: validateAlgorithms(flaw.betterAlgorithms as string[]),
    }));

    // Validate best alternative
    let bestAlternative = undefined;
    if (parsed.bestAlternative && parsed.bestAlternative.algorithm) {
      const algo = validateAlgorithm(parsed.bestAlternative.algorithm);
      if (algo) {
        bestAlternative = {
          algorithm: algo,
          reason: String(parsed.bestAlternative.reason || ''),
        };
      }
    }

    return {
      flaws,
      overallAssessment: String(parsed.overallAssessment || 'Analysis complete.'),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
      bestAlternative,
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    // Return a fallback response
    return {
      flaws: [],
      overallAssessment: 'Unable to fully parse the analysis. The simulation completed successfully.',
      strengths: [],
      recommendations: ['Consider running the analysis again for detailed insights.'],
      bestAlternative: undefined,
    };
  }
}

// Validation helpers
const VALID_FLAW_TYPES: FlawType[] = [
  'convoy',
  'starvation',
  'context_switches',
  'high_waiting',
  'priority_issue',
  'quantum_inefficiency',
];

const VALID_SEVERITIES: FlawSeverity[] = ['low', 'medium', 'high'];

const VALID_ALGORITHMS: AlgorithmType[] = [
  'fcfs',
  'sjf',
  'srtf',
  'priority',
  'priority-preemptive',
  'rr',
];

function validateFlawType(type: string): FlawType {
  if (VALID_FLAW_TYPES.includes(type as FlawType)) {
    return type as FlawType;
  }
  return 'high_waiting'; // Default fallback
}

function validateSeverity(severity: string): FlawSeverity {
  if (VALID_SEVERITIES.includes(severity as FlawSeverity)) {
    return severity as FlawSeverity;
  }
  return 'medium'; // Default fallback
}

function validateAlgorithm(algo: string): AlgorithmType | null {
  if (VALID_ALGORITHMS.includes(algo as AlgorithmType)) {
    return algo as AlgorithmType;
  }
  return null;
}

function validateAlgorithms(algos: string[] | undefined): AlgorithmType[] {
  if (!Array.isArray(algos)) return [];
  return algos
    .map(validateAlgorithm)
    .filter((a): a is AlgorithmType => a !== null);
}

// Helper to prepare simulation data for analysis
export function prepareSimulationData(
  algorithm: AlgorithmType,
  processes: Array<{
    name: string;
    arrivalTime: number;
    cpuBurstTime: number;
    ioBurstTime: number;
    priority: number;
    completionTime: number | null;
    waitingTime: number;
    responseTime: number | null;
  }>,
  ganttChart: Array<{
    processId: string | null;
    processName: string;
    startTime: number;
    endTime: number;
    isPreempted?: boolean;
  }>,
  statistics: {
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    avgResponseTime: number;
    cpuUtilization: number;
    totalTime: number;
  },
  timeQuantum?: number
): SimulationDataForAnalysis {
  // Count context switches (number of Gantt entries minus idle periods minus 1)
  const contextSwitches = ganttChart.filter(g => g.processId !== null).length - 1;

  return {
    algorithm,
    algorithmName: ALGORITHMS[algorithm].name,
    timeQuantum,
    processes: processes.map(p => ({
      ...p,
      turnaroundTime: p.completionTime !== null ? p.completionTime - p.arrivalTime : 0,
    })),
    ganttSummary: ganttChart
      .filter(g => g.processId !== null) // Exclude idle periods
      .map(g => ({
        processName: g.processName,
        startTime: g.startTime,
        endTime: g.endTime,
        wasPreempted: g.isPreempted || false,
      })),
    statistics: {
      ...statistics,
      contextSwitches: Math.max(0, contextSwitches),
    },
  };
}
