'use client';

import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS } from '@/lib/types';

export default function AlgorithmInfo() {
  const { algorithm } = useSchedulerStore();
  const info = ALGORITHMS[algorithm];

  return (
    <div className="card">
      <div className="section-header">
        <h2 className="section-title">About {info.shortName}</h2>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {info.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {info.isPreemptive ? (
            <span className="badge bg-amber-50 text-amber-700">Preemptive</span>
          ) : (
            <span className="badge bg-gray-100 text-gray-600">Non-preemptive</span>
          )}
          <span className="badge bg-gray-100 text-gray-600">{info.timeComplexity}</span>
        </div>

        {info.pros && (
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase">Pros</span>
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {info.pros.map((pro, i) => <li key={i}>{pro}</li>)}
            </ul>
          </div>
        )}

        {info.cons && (
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase">Cons</span>
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {info.cons.map((con, i) => <li key={i}>{con}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
