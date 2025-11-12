'use client';

import { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  requireTyping?: string; // Require user to type this text to confirm
}

/**
 * Confirmation Modal for Critical Actions
 *
 * Provides double-confirmation for dangerous admin operations
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  danger = false,
  requireTyping,
}: ConfirmationModalProps) {
  const [typedText, setTypedText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isConfirmEnabled = requireTyping
    ? typedText === requireTyping
    : true;

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;

    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
      setTypedText('');
    }
  };

  const handleClose = () => {
    setTypedText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          danger ? 'border-red-500/50 bg-red-500/10' : 'border-gray-700'
        }`}>
          <h3 className={`text-xl font-semibold ${
            danger ? 'text-red-400' : 'text-white'
          }`}>
            {danger && '⚠️ '}{title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-300">{message}</p>

          {requireTyping && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Type <code className="bg-gray-700 px-2 py-1 rounded text-yellow-400">{requireTyping}</code> to confirm
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={requireTyping}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          {danger && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-yellow-400 text-sm font-semibold">
                ⚠️ This action cannot be undone
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || loading}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
