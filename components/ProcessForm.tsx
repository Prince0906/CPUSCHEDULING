'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';

export default function ProcessForm() {
  const { processes, algorithm, addProcess, removeProcess, clearProcesses, loadExample, playbackState, isCompareMode } = useSchedulerStore();
  const isRunning = playbackState !== 'stopped';
  const showPriority = algorithm === 'priority' || algorithm === 'priority-preemptive' || isCompareMode;
  
  const [formData, setFormData] = useState({
    name: 'P1',
    arrivalTime: 0,
    cpuBurstTime: 4,
    ioBurstTime: 0,
    priority: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.cpuBurstTime < 1) return;
    if (processes.some(p => p.name === formData.name.trim())) return;

    addProcess({
      name: formData.name.trim(),
      arrivalTime: formData.arrivalTime,
      cpuBurstTime: formData.cpuBurstTime,
      ioBurstTime: formData.ioBurstTime,
      priority: formData.priority,
    });

    const nextNumber = processes.length + 2;
    setFormData({
      name: `P${nextNumber}`,
      arrivalTime: 0,
      cpuBurstTime: 4,
      ioBurstTime: 0,
      priority: nextNumber,
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
              onChange={(e) => setFormData({ ...formData, arrivalTime: parseInt(e.target.value) || 0 })}
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
              onChange={(e) => setFormData({ ...formData, cpuBurstTime: parseInt(e.target.value) || 1 })}
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
              onChange={(e) => setFormData({ ...formData, ioBurstTime: parseInt(e.target.value) || 0 })}
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
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              disabled={isRunning}
              className="input"
            />
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

      {/* Process List - Minimal */}
      <div className="border-t border-gray-100">
        <div className="max-h-[300px] overflow-y-auto">
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
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: process.color }}
                      />
                      <span className="font-medium text-gray-900">{process.name}</span>
                      <span className="text-xs text-gray-400">
                        {process.cpuBurstTime}ms
                        {showPriority && ` · P${process.priority}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        process.state === 'ready' ? 'state-ready' :
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
