'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, CheckCircle2, Key, ChevronDown, GitCompare, Sparkles, TriangleAlert, Lightbulb } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS } from '@/lib/types';
import { FlawDetection, FLAW_TYPE_INFO } from '@/lib/analysis/types';
import { hasUserApiKey, getEnvKeyStatus } from '@/lib/analysis/openai';
import ApiKeyModal from './ApiKeyModal';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`h-3 bg-gray-200 rounded-full animate-pulse ${className}`} />
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-5">
      {/* Executive Summary skeleton */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-indigo-200 rounded animate-pulse" />
          <SkeletonLine className="w-36 bg-indigo-200" />
        </div>
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
        <SkeletonLine className="w-3/5" />
      </div>
      {/* Hero block skeleton */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <SkeletonLine className="w-40" />
        <div className="flex gap-2">
          <div className="h-7 w-14 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full" />
      </div>
    </div>
  );
}

// ─── Refined Issue Row ────────────────────────────────────────────────────────
function IssueRow({ flaw, index }: { flaw: FlawDetection; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const flawInfo = FLAW_TYPE_INFO[flaw.type];

  const severityDot = {
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
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot}`} />
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
            <div className="pl-5 pb-3 pr-2 space-y-2">
              {/* Problem description */}
              <div className="flex items-start gap-2">
                <TriangleAlert className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed">{flaw.description}</p>
              </div>
              {/* AI Recommendation — visually distinct */}
              {flaw.recommendation && (
                <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Recommendation</span>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{flaw.recommendation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FlawAnalysis() {
  const {
    isSimulationComplete,
    analysisResult,
    isAnalyzing,
    analysisError,
    runAnalysis,
    algorithm,
    processes,
    compareWithAlternatives,
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

  if (!isSimulationComplete || processes.length === 0) return null;
  if (!mounted) return null;

  const algorithmName = ALGORITHMS[algorithm]?.shortName || algorithm;
  const flaws = analysisResult?.flaws || [];
  const suggestedAlternatives = analysisResult?.suggestedAlternatives || [];
  const hasAlternatives = suggestedAlternatives.length > 0;

  // Severity counts for dots
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
            <h2 className="section-title">Flaw Analysis</h2>
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
          {/* ─── API Key Required ─────────────────────────────────────── */}
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

          {/* ─── Loading / Analyzing ──────────────────────────────────── */}
          {((envKeyStatus !== false || userKeyConfigured) && !isAnalyzing && !analysisResult && !analysisError) && (
            <AnalysisSkeleton />
          )}

          {isAnalyzing && <AnalysisSkeleton />}

          {/* ─── Error ───────────────────────────────────────────────── */}
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

          {/* ─── Results ─────────────────────────────────────────────── */}
          {analysisResult && (
            <div className="space-y-5">

              {/* 1. Executive Summary ────────────────────────────────── */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI Overall Assessment</span>
                </div>
                <p className="text-sm text-indigo-900 leading-relaxed">{analysisResult.overallAssessment}</p>
              </div>

              {/* 2. Optimization Opportunities Hero Block ─────────────── */}
              {hasAlternatives && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl p-4 border border-sky-100"
                >
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Optimization Opportunities
                  </p>
                  {/* Algorithm chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedAlternatives.map((algo) => (
                      <span
                        key={algo}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-sky-200 text-sky-700 shadow-sm"
                      >
                        {ALGORITHMS[algo]?.shortName || algo}
                      </span>
                    ))}
                  </div>
                  {/* CTA Button */}
                  <button
                    onClick={() => compareWithAlternatives(suggestedAlternatives)}
                    className="btn btn-primary w-full py-2.5 text-sm font-medium gap-2"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare with Alternatives
                  </button>
                </motion.div>
              )}

              {/* 3. Optimal State (no flaws, no alternatives) ─────────── */}
              {flaws.length === 0 && !hasAlternatives && (
                <div className="flex items-center gap-3 py-4 px-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-800">Optimal Performance</p>
                    <p className="text-sm text-emerald-600 mt-0.5">No major flaws detected for this specific workload.</p>
                  </div>
                </div>
              )}

              {/* 4. Issue List ───────────────────────────────────────── */}
              {flaws.length > 0 && (
                <div>
                  {/* Issues header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        {flaws.length} Issue{flaws.length !== 1 ? 's' : ''}
                      </span>
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

                  {/* Issue rows */}
                  <div className="space-y-1">
                    {flaws.map((flaw, index) => (
                      <IssueRow key={`${flaw.type}-${index}`} flaw={flaw} index={index} />
                    ))}
                  </div>
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
