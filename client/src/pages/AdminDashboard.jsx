import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-800',
  approved: 'text-green-400 bg-green-400/10 border-green-800',
  rejected: 'text-red-400 bg-red-400/10 border-red-800',
  'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-800',
};

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/requests?status=${filter}`);
      setRequests(res.data.requests);
    } catch {
      logout(); navigate('/admin/login');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const updateStatus = async (id, status, adminNote = '') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/requests/${id}`, { status, adminNote });
      await fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
    setUpdating(null);
  };

  const handleReject = async (id) => {
    const note = prompt('Rejection reason (optional):') || '';
    updateStatus(id, 'rejected', note);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="text-sm text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'in-progress', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg border text-sm capitalize transition-colors ${
              filter === s ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-600">No {filter} requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{req.iconName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                    <span className="text-zinc-500 text-sm">▲ {req.upvotes} upvotes</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{req.description}</p>
                  {req.referenceUrl && (
                    <a href={req.referenceUrl} target="_blank" rel="noreferrer" className="text-yellow-400 text-xs hover:underline">
                      {req.referenceUrl}
                    </a>
                  )}
                  <p className="text-zinc-600 text-xs mt-2">
                    By {req.submitterName || 'Anonymous'} · {req.submitterEmail} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.adminNote && (
                    <p className="text-zinc-500 text-xs mt-1 italic">Note: {req.adminNote}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {req.status !== 'in-progress' && (
                  <button
                    onClick={() => updateStatus(req._id, 'in-progress')}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-blue-700 text-blue-400 rounded-lg hover:bg-blue-900/30 disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {req.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(req._id, 'approved')}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-green-700 text-green-400 rounded-lg hover:bg-green-900/30 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {req.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-red-800 text-red-400 rounded-lg hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
