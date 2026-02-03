'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey, isValidApiKeyFormat } from '@/lib/analysis/openai';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existingKey = getApiKey();
      setHasExistingKey(!!existingKey);
      if (existingKey) {
        setApiKeyState('sk-...' + existingKey.slice(-4));
      } else {
        setApiKeyState('');
      }
      setError(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    setError(null);

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    if (apiKey.startsWith('sk-...')) {
      onClose();
      return;
    }

    if (!isValidApiKeyFormat(apiKey)) {
      setError('Invalid format. Key should start with "sk-"');
      return;
    }

    setApiKey(apiKey.trim());
    onClose();
  };

  const handleRemove = () => {
    removeApiKey();
    setApiKeyState('');
    setHasExistingKey(false);
    setError(null);
  };

  const handleInputChange = (value: string) => {
    if (hasExistingKey && apiKey.startsWith('sk-...')) {
      setApiKeyState(value);
      setHasExistingKey(false);
    } else {
      setApiKeyState(value);
    }
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">API Key</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="sk-..."
                      className={`input pr-10 ${error ? 'ring-2 ring-red-200' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Get your key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:text-sky-600"
                  >
                    platform.openai.com
                  </a>
                  . Stored locally in your browser.
                </p>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                {hasExistingKey ? (
                  <button
                    onClick={handleRemove}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="btn btn-secondary px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary px-4 py-2 text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
