'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';

export default function ProcessForm() {
  const { processes, algorithm, addProcess, removeProcess, clearProcesses, loadExample, playbackState, isCompareMode } = useSchedulerStore();
  const isRunning = playbackState !== 'stopped';
  const showPriority = algorithm === 'priority' || algorithm === 'priority-preemptive' || isCompareMode;
  const showQueueLevel = algorithm === 'mlq' || isCompareMode;

  const [formData, setFormData] = useState({
    name: 'P1',
    arrivalTime: 0,
    cpuBurstTime: 4,
    ioBurstTime: 0,
    priority: 1,
    queueLevel: 1,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Process name is required');
      return;
    }

    if (formData.cpuBurstTime < 1) {
      setError('CPU burst must be at least 1');
      return;
    }

    if (processes.some(p => p.name === formData.name.trim())) {
      setError(`Process "${formData.name.trim()}" already exists`);
      return;
    }

    addProcess({
      name: formData.name.trim(),
      arrivalTime: formData.arrivalTime,
      cpuBurstTime: formData.cpuBurstTime,
      ioBurstTime: formData.ioBurstTime,
      priority: formData.priority,
      queueLevel: formData.queueLevel,
    });

    const nextNumber = processes.length + 2;
    setFormData({
      name: `P${nextNumber}`,
      arrivalTime: 0,
      cpuBurstTime: 4,
      ioBurstTime: 0,
      priority: nextNumber,
      queueLevel: 1,
    });
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Processes</h2>
        <span className="text-sm text-gray-400">{processes.length}</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isRunning}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">Arrival</label>
            <input
              type="number"
              min="0"
              value={formData.arrivalTime}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, arrivalTime: isNaN(value) || value < 0 ? 0 : value });
              }}
              disabled={isRunning}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">CPU Burst</label>
            <input
              type="number"
              min="1"
              value={formData.cpuBurstTime}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, cpuBurstTime: isNaN(value) || value < 1 ? 1 : value });
              }}
              disabled={isRunning}
              className="input"
            />
          </div>
          <div>
            <label className="input-label">I/O Burst</label>
            <input
              type="number"
              min="0"
              value={formData.ioBurstTime}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData({ ...formData, ioBurstTime: isNaN(value) || value < 0 ? 0 : value });
              }}
              disabled={isRunning}
              className="input"
            />
          </div>
        </div>

        {showPriority && (
          <div>
            <label className="input-label">Priority (1 = highest)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                // Clamp priority between 1 and 10
                const clamped = isNaN(value) ? 1 : Math.max(1, Math.min(10, value));
                setFormData({ ...formData, priority: clamped });
              }}
              disabled={isRunning}
              className="input"
            />
          </div>
        )}

        {showQueueLevel && (
          <div>
            <label className="input-label">Queue Level (1=High, 2=Med, 3=Low)</label>
            <input
              type="number"
              min="1"
              max="3"
              value={formData.queueLevel}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const clamped = isNaN(value) ? 1 : Math.max(1, Math.min(3, value));
                setFormData({ ...formData, queueLevel: clamped });
              }}
              disabled={isRunning}
              className="input"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isRunning}
            className="btn btn-primary flex-1 py-3 text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add
          </button>
          <button
            type="button"
            onClick={loadExample}
            disabled={isRunning}
            className="btn btn-secondary px-4 py-3 text-sm"
          >
            Demo
          </button>
        </div>
      </form>

      {/* Process List */}
      <div className="border-t border-gray-100">
        {/* Column Headers */}
        {processes.length > 0 && (
          <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            <div className="w-16">Name</div>
            <div className="w-16 text-center">Arrival</div>
            <div className="w-16 text-center">Burst</div>
            <div className="w-12 text-center">I/O</div>
            {showPriority && <div className="w-14 text-center">Priority</div>}
            <div className="flex-1 text-right">Status</div>
          </div>
        )}

        <div className="max-h-[280px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {processes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No processes added
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {processes.map((process) => (
                  <motion.div
                    key={process.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center px-6 py-2.5 hover:bg-gray-50 group"
                  >
                    {/* Process Name with Color */}
                    <div className="w-16 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: process.color }}
                      />
                      <span className="font-medium text-gray-900 text-sm">{process.name}</span>
                    </div>

                    {/* Arrival Time */}
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-600 tabular-nums">{process.arrivalTime}ms</span>
                    </div>

                    {/* Burst Time */}
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-600 tabular-nums">{process.cpuBurstTime}ms</span>
                    </div>

                    {/* I/O Time */}
                    <div className="w-12 text-center">
                      <span className="text-xs text-gray-500 tabular-nums">
                        {process.ioBurstTime > 0 ? `${process.ioBurstTime}ms` : '—'}
                      </span>
                    </div>

                    {/* Priority */}
                    {showPriority && (
                      <div className="w-14 text-center">
                        <span className="text-xs text-gray-600 tabular-nums">{process.priority}</span>
                      </div>
                    )}

                    {/* Status and Actions */}
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className={`badge text-[10px] ${process.state === 'ready' ? 'state-ready' :
                          process.state === 'running' ? 'state-running' :
                            process.state === 'waiting' ? 'state-waiting' :
                              process.state === 'terminated' ? 'state-completed' :
                                'state-new'
                        }`}>
                        {process.state === 'terminated' ? 'done' : process.state}
                      </span>
                      {!isRunning && (
                        <button
                          onClick={() => removeProcess(process.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {processes.length > 0 && !isRunning && (
          <div className="px-6 py-3 border-t border-gray-100">
            <button
              onClick={clearProcesses}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
