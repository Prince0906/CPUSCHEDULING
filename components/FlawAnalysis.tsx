'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle2, Key, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS } from '@/lib/types';
import { FlawDetection, FLAW_TYPE_INFO } from '@/lib/analysis/types';
import { hasUserApiKey, getEnvKeyStatus } from '@/lib/analysis/openai';
import ApiKeyModal from './ApiKeyModal';

// Compact issue row with expand
function IssueRow({ flaw, index }: { flaw: FlawDetection; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const flawInfo = FLAW_TYPE_INFO[flaw.type];
  
  const severityColor = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-amber-400',
  }[flaw.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2.5 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
      >
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityColor}`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{flawInfo.label}</span>
          {flaw.affectedProcesses.length > 0 && (
            <span className="text-sm text-gray-400 ml-2">
              {flaw.affectedProcesses.join(', ')}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-5 pb-3 pr-2">
              <p className="text-sm text-gray-500 leading-relaxed">{flaw.description}</p>
              {flaw.recommendation && (
                <p className="text-sm text-sky-600 mt-2">{flaw.recommendation}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Comparison bar component
function ComparisonBar({ 
  label, 
  currentValue, 
  recommendedValue, 
  unit,
  isLowerBetter = true 
}: { 
  label: string; 
  currentValue: number; 
  recommendedValue: number; 
  unit: string;
  isLowerBetter?: boolean;
}) {
  const maxValue = Math.max(currentValue, recommendedValue);
  const currentWidth = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
  const recommendedWidth = maxValue > 0 ? (recommendedValue / maxValue) * 100 : 0;
  
  const isImproved = isLowerBetter 
    ? recommendedValue < currentValue 
    : recommendedValue > currentValue;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="w-14 text-xs text-gray-400">Current</div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 rounded-full transition-all duration-500"
              style={{ width: `${currentWidth}%` }}
            />
          </div>
          <div className="w-16 text-right text-xs text-gray-600 tabular-nums">
            {currentValue.toFixed(1)}{unit}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 text-xs text-gray-400">Better</div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isImproved ? 'bg-emerald-500' : 'bg-gray-400'}`}
              style={{ width: `${recommendedWidth}%` }}
            />
          </div>
          <div className={`w-16 text-right text-xs tabular-nums ${isImproved ? 'text-emerald-600 font-medium' : 'text-gray-600'}`}>
            {recommendedValue.toFixed(1)}{unit}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlawAnalysis() {
  const {
    isSimulationComplete,
    analysisResult,
    isAnalyzing,
    analysisError,
    runAnalysis,
    algorithm,
    processes,
    recommendedResult,
    isRunningRecommended,
    switchToRecommendedAlgorithm,
  } = useSchedulerStore();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userKeyConfigured, setUserKeyConfigured] = useState(false);
  const [envKeyStatus, setEnvKeyStatus] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserKeyConfigured(hasUserApiKey());
    setEnvKeyStatus(getEnvKeyStatus());
  }, [showApiKeyModal]);
  
  useEffect(() => {
    if (analysisResult || analysisError) {
      setEnvKeyStatus(getEnvKeyStatus());
      setUserKeyConfigured(hasUserApiKey());
    }
  }, [analysisResult, analysisError]);

  if (!isSimulationComplete || processes.length === 0) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  const algorithmName = ALGORITHMS[algorithm]?.shortName || algorithm;
  const flaws = analysisResult?.flaws || [];
  const hasRecommendation = analysisResult?.bestAlternative && analysisResult.bestAlternative.algorithm !== algorithm;
  
  // Calculate current stats for comparison
  const currentStats = {
    avgWaitingTime: processes.reduce((sum, p) => sum + p.waitingTime, 0) / processes.length,
    avgTurnaroundTime: processes.reduce((sum, p) => sum + (p.completionTime ? p.completionTime - p.arrivalTime : 0), 0) / processes.length,
    avgResponseTime: processes.reduce((sum, p) => sum + (p.responseTime ?? 0), 0) / processes.length,
  };

  // Calculate improvement percentage
  let improvementPercent = 0;
  let improvementMetric = 'wait time';
  if (recommendedResult && currentStats.avgWaitingTime > 0) {
    improvementPercent = ((currentStats.avgWaitingTime - recommendedResult.statistics.avgWaitingTime) / currentStats.avgWaitingTime) * 100;
  }

  // Severity counts for the dots display
  const severityCounts = flaws.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="section-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="section-title">AI Analysis</h2>
          </div>
          {(envKeyStatus !== true || userKeyConfigured) && (
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              API Key
            </button>
          )}
        </div>

        <div className="p-6">
          {/* API Key Required */}
          {!userKeyConfigured && envKeyStatus === false && !isAnalyzing && !analysisResult && !analysisError && (
            <div className="text-center py-8">
              <Key className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Configure API key for AI analysis</p>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="btn btn-primary px-5 py-2.5"
              >
                Add API Key
              </button>
            </div>
          )}

          {/* Loading States */}
          {((envKeyStatus !== false || userKeyConfigured) && !isAnalyzing && !analysisResult && !analysisError) && (
            <div className="flex items-center justify-center gap-3 py-10">
              <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />
              <span className="text-gray-600">Analyzing...</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center gap-3 py-10">
              <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />
              <span className="text-gray-600">Analyzing with AI...</span>
            </div>
          )}

          {/* Error */}
          {analysisError && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{analysisError}</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowApiKeyModal(true)} className="btn btn-secondary px-4 py-2">
                  Settings
                </button>
                <button onClick={runAnalysis} className="btn btn-primary px-5 py-2">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {analysisResult && (
            <div className="space-y-6">
              
              {/* Hero Insight - Recommendation with Visual Comparison */}
              {hasRecommendation && (
                <div className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-xl p-5 border border-sky-100">
                  {/* Headline */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {improvementPercent > 0 ? (
                        <>
                          <span className="text-emerald-600">{ALGORITHMS[analysisResult.bestAlternative!.algorithm]?.shortName}</span>
                          {' '}would reduce {improvementMetric} by{' '}
                          <span className="text-emerald-600">{improvementPercent.toFixed(0)}%</span>
                        </>
                      ) : (
                        <>
                          Try <span className="text-sky-600">{ALGORITHMS[analysisResult.bestAlternative!.algorithm]?.shortName}</span> for this workload
                        </>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {analysisResult.bestAlternative!.reason}
                    </p>
                  </div>

                  {/* Visual Comparison Bars */}
                  {recommendedResult ? (
                    <div className="space-y-4 mb-5">
                      <ComparisonBar
                        label="Average Wait Time"
                        currentValue={currentStats.avgWaitingTime}
                        recommendedValue={recommendedResult.statistics.avgWaitingTime}
                        unit="ms"
                        isLowerBetter={true}
                      />
                      <ComparisonBar
                        label="Average Turnaround"
                        currentValue={currentStats.avgTurnaroundTime}
                        recommendedValue={recommendedResult.statistics.avgTurnaroundTime}
                        unit="ms"
                        isLowerBetter={true}
                      />
                    </div>
                  ) : isRunningRecommended ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Calculating comparison...
                    </div>
                  ) : null}

                  {/* Action Button */}
                  <button
                    onClick={switchToRecommendedAlgorithm}
                    className="btn btn-primary w-full py-3 text-sm font-medium gap-2"
                  >
                    Switch to {ALGORITHMS[analysisResult.bestAlternative!.algorithm]?.shortName}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* No Issues - Good Performance */}
              {flaws.length === 0 && !hasRecommendation && (
                <div className="flex items-center gap-3 py-4 px-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-800">{algorithmName} is optimal for this workload</p>
                    <p className="text-sm text-emerald-600 mt-0.5">{analysisResult.overallAssessment}</p>
                  </div>
                </div>
              )}

              {/* Issues Section */}
              {flaws.length > 0 && (
                <div>
                  {/* Issues Header with Severity Dots */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">{flaws.length} Issue{flaws.length !== 1 ? 's' : ''}</span>
                      <div className="flex items-center gap-1.5">
                        {severityCounts.high > 0 && (
                          <div className="flex items-center gap-1">
                            {Array(severityCounts.high).fill(0).map((_, i) => (
                              <span key={`high-${i}`} className="w-2 h-2 rounded-full bg-red-500" />
                            ))}
                          </div>
                        )}
                        {severityCounts.medium > 0 && (
                          <div className="flex items-center gap-1">
                            {Array(severityCounts.medium).fill(0).map((_, i) => (
                              <span key={`med-${i}`} className="w-2 h-2 rounded-full bg-orange-500" />
                            ))}
                          </div>
                        )}
                        {severityCounts.low > 0 && (
                          <div className="flex items-center gap-1">
                            {Array(severityCounts.low).fill(0).map((_, i) => (
                              <span key={`low-${i}`} className="w-2 h-2 rounded-full bg-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={runAnalysis}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-analyze
                    </button>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-1">
                    {flaws.map((flaw, index) => (
                      <IssueRow key={`${flaw.type}-${index}`} flaw={flaw} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation without comparison (if no better algorithm) */}
              {!hasRecommendation && flaws.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">{analysisResult.overallAssessment}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </>
  );
}
