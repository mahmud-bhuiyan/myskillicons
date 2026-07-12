import { useState, useEffect } from 'react';
import { useRequests } from '../context/RequestsContext';
import api from '../utils/api';

const fieldClass =
  'w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400';

export default function RequestIcon() {
  const { requests: existingRequests, refresh } = useRequests();
  const [form, setForm] = useState({
    iconName: '', description: '', referenceUrl: '', submitterEmail: '', submitterName: ''
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/request', form);
      setStatus({ type: 'success', message: res.data.message });
      setForm({ iconName: '', description: '', referenceUrl: '', submitterEmail: '', submitterName: '' });
      await refresh();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Something went wrong' });
    }
    setLoading(false);
  };

  const handleUpvote = async (id) => {
    const email = prompt('Enter your email to upvote:');
    if (!email) return;
    try {
      await api.post(`/request/${id}/upvote`, { email });
      await refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not upvote');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Request an Icon</h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8">Don't see your tech? Submit a request and the community can upvote it.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Your Name</label>
            <input
              type="text"
              placeholder="Optional"
              value={form.submitterName}
              onChange={e => setForm({ ...form, submitterName: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Your Email *</label>
            <input
              required
              type="email"
              placeholder="dev@example.com"
              value={form.submitterEmail}
              onChange={e => setForm({ ...form, submitterEmail: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Icon Name *</label>
          <input
            required
            type="text"
            placeholder="e.g. Vue.js"
            value={form.iconName}
            onChange={e => setForm({ ...form, iconName: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Description * (why is this icon needed?)</label>
          <textarea
            required
            rows={3}
            maxLength={500}
            placeholder="This is a popular framework used for..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className={`${fieldClass} resize-none`}
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Reference URL (official site or logo)</label>
          <input
            type="url"
            placeholder="https://vuejs.org"
            value={form.referenceUrl}
            onChange={e => setForm({ ...form, referenceUrl: e.target.value })}
            className={fieldClass}
          />
        </div>

        {status && (
          <div className={`p-3 rounded-lg text-sm ${
            status.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {/* Existing requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pending Requests ({existingRequests.length})</h2>
        <div className="space-y-3">
          {existingRequests.map(req => (
            <div key={req._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-start gap-4">
              <button
                onClick={() => handleUpvote(req._id)}
                className="flex flex-col items-center min-w-10 py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:border-yellow-400 transition-colors"
              >
                <span className="text-xs">▲</span>
                <span className="text-sm font-semibold">{req.upvotes}</span>
              </button>
              <div className="flex-1">
                <h3 className="font-medium">{req.iconName}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-0.5">{req.description}</p>
                {req.referenceUrl && (
                  <a href={req.referenceUrl} target="_blank" rel="noreferrer" className="text-yellow-600 dark:text-yellow-400 text-xs mt-1 inline-block hover:underline">
                    {req.referenceUrl}
                  </a>
                )}
              </div>
            </div>
          ))}
          {existingRequests.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-600 text-sm">No pending requests yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
