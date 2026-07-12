import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PasswordInput from '../components/PasswordInput';
import { resolveServerUrl } from '../utils/serverUrl';

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.8-3.2 4.1-4.8 6.5-4.8s4.7 1.6 6.5 4.8" />
    </svg>
  );
}

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AdminDetails() {
  const { username, avatar, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(username || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [passwords, setPasswords] = useState(emptyPasswords);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    setName(username || '');
  }, [username]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const res = await api.patch('/admin/profile', { username: name.trim() });
      updateProfile(res.data.username, res.data.avatar);
      setProfileSuccess('Name updated');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update name');
    }
    setProfileLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');
    setAvatarLoading(true);
    try {
      const body = new FormData();
      body.append('avatar', file);
      const res = await api.patch('/admin/avatar', body);
      updateProfile(res.data.username, res.data.avatar);
      setAvatarSuccess('Image updated');
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Failed to upload image');
    }
    setAvatarLoading(false);
  };

  const handleRemoveAvatar = async () => {
    setAvatarError('');
    setAvatarSuccess('');
    setAvatarLoading(true);
    try {
      const res = await api.delete('/admin/avatar');
      updateProfile(res.data.username, res.data.avatar);
      setAvatarSuccess('Image removed');
    } catch (err) {
      setAvatarError(err.response?.data?.error || 'Failed to remove image');
    }
    setAvatarLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }

    setPwLoading(true);
    try {
      await api.patch('/admin/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPwSuccess('Password updated successfully');
      setPasswords(emptyPasswords);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    }
    setPwLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin details</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage your name, profile image, and password.
        </p>
      </div>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Profile image</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center shrink-0">
            {avatar ? (
              <img src={resolveServerUrl(avatar)} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-zinc-500" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {avatarLoading ? 'Uploading...' : 'Upload image'}
            </button>
            {avatar && (
              <button
                type="button"
                disabled={avatarLoading}
                onClick={handleRemoveAvatar}
                className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-50 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {avatarError && <p className="text-red-400 text-sm mt-3">{avatarError}</p>}
        {avatarSuccess && <p className="text-green-400 text-sm mt-3">{avatarSuccess}</p>}
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Display name</h2>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={3}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400"
          />
          {profileError && <p className="text-red-400 text-sm">{profileError}</p>}
          {profileSuccess && <p className="text-green-400 text-sm">{profileSuccess}</p>}
          <button
            type="submit"
            disabled={profileLoading || name.trim() === username}
            className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {profileLoading ? 'Saving...' : 'Save name'}
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <PasswordInput
            placeholder="Current password"
            required
            value={passwords.currentPassword}
            onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <PasswordInput
            placeholder="New password"
            required
            value={passwords.newPassword}
            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <PasswordInput
            placeholder="Confirm new password"
            required
            value={passwords.confirmPassword}
            onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
          />
          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-400 text-sm">{pwSuccess}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {pwLoading ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
