import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { validateApiKey } from '../services/groqApi';
import { GroqModel } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onKeyConnected: (key: string, models: GroqModel[]) => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onKeyConnected,
  onDisconnect,
  isConnected,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey) {
      setErrorMessage('Please enter a Groq API key to connect.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await validateApiKey(cleanKey);
    setIsValidating(false);

    if (result.success && result.models) {
      setSuccessMessage(`Connected successfully! ${result.models.length} models available.`);
      onKeyConnected(cleanKey, result.models);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 900);
    } else {
      setErrorMessage(result.error || 'Failed to validate API key. Please check the key and try again.');
    }
  };

  const handleDisconnect = () => {
    setInputKey('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onDisconnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1017] border border-[#232738] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141724] border-b border-[#232738]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Connect Groq API Key</h2>
              <p className="text-xs text-gray-400">Direct, secure browser connection to GroqCloud</p>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#121520] border border-blue-500/20 text-xs text-gray-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-semibold text-blue-300">In-Memory Active Session Only:</span>
              <p className="text-gray-400 leading-relaxed">
                Your key is stored strictly in memory for this browser session. It is never logged, never hardcoded, and never uploaded to any intermediary server.
              </p>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Groq API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="gsk_..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 pr-20 bg-[#161a26] border border-gray-700/80 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Need an API key? Get one instantly for free at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:underline inline-flex items-center gap-0.5"
                >
                  console.groq.com/keys <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                >
                  Disconnect Key
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {isConnected && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isValidating || !inputKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating with Groq API...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      {isConnected ? 'Update & Validate' : 'Connect API Key'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
