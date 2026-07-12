import { useEffect, useRef, useState } from 'react';
import { fieldClassFull as fieldClass } from '../utils/formClasses';

const UpvoteModal = ({ open, iconName, loading, onClose, onConfirm }) => {
  const [email, setEmail] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upvote-modal-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xl">
        <h2 id="upvote-modal-title" className="text-lg font-semibold mb-1">
          Upvote request
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Enter your email to upvote{iconName ? ` “${iconName}”` : ''}. Max 5 upvotes every 10 minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="upvote-email" className="text-xs text-zinc-500 mb-1 block">
              Email *
            </label>
            <input
              id="upvote-email"
              ref={inputRef}
              required
              type="email"
              placeholder="dev@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={fieldClass}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Upvoting...' : 'Upvote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpvoteModal;
