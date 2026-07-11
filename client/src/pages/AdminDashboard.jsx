import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useIcons } from '../context/IconsContext';
import api from '../utils/api';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-800',
  approved: 'text-green-400 bg-green-400/10 border-green-800',
  rejected: 'text-red-400 bg-red-400/10 border-red-800',
  'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-800',
};

const DEFAULT_CATEGORIES = [
  'build',
  'cloud',
  'cms',
  'database',
  'design',
  'devops',
  'framework',
  'game',
  'hardware',
  'ide',
  'language',
  'library',
  'markup',
  'ml',
  'os',
  'productivity',
  'runtime',
  'social',
  'testing',
  'tool',
];

const emptyForm = {
  key: '',
  name: '',
  category: 'tool',
  tags: '',
  svgContent: '',
  lightBg: '#F0F0F0',
  lightPrimary: '#181717',
  darkBg: '#181717',
  darkPrimary: '#FFFFFF',
};

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function resolveTab(raw) {
  if (raw === 'requests' || raw === 'categories') return raw;
  return 'icons';
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveTab(searchParams.get('tab'));

  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState(null);

  const {
    icons,
    iconsLoading,
    iconsLoaded,
    categories: orderedCategories,
    categoriesLoading,
    categoriesLoaded,
    requestsByStatus,
    requestsLoadingByStatus,
    refreshIcons,
    refreshCategories,
    saveCategoryOrder,
    refreshRequests,
  } = useAdminData();
  const { refresh: refreshPublicIcons } = useIcons();

  const requests = requestsByStatus[filter] || [];
  // Only show a loading placeholder on true cold start (no cache, no icons yet).
  // Revisits / tab switches keep the existing list; API revalidates in the background.
  const showIconsLoading = iconsLoading && !iconsLoaded && icons.length === 0;
  const showRequestsLoading =
    Boolean(requestsLoadingByStatus[filter]) && !Array.isArray(requestsByStatus[filter]);
  const showCategoriesLoading =
    categoriesLoading && !categoriesLoaded && orderedCategories.length === 0;

  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [svgFile, setSvgFile] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const categoryListRef = useRef(categoryList);
  categoryListRef.current = categoryList;

  const setTab = (next) => {
    if (next === 'requests') setSearchParams({ tab: 'requests' });
    else if (next === 'categories') setSearchParams({ tab: 'categories' });
    else setSearchParams({});
  };

  useEffect(() => {
    if (tab === 'requests') refreshRequests(filter);
    else if (tab === 'categories') refreshCategories();
    else {
      refreshIcons();
      refreshCategories();
    }
  }, [tab, filter, refreshRequests, refreshIcons, refreshCategories]);

  useEffect(() => {
    setCategoryList(orderedCategories);
  }, [orderedCategories]);

  useEffect(() => {
    if (!showForm && !deleteTarget) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) {
        if (!deleting) setDeleteTarget(null);
        return;
      }
      resetForm();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showForm, deleteTarget, deleting]);

  const updateStatus = async (id, status, adminNote = '') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/requests/${id}`, { status, adminNote });
      await refreshRequests(filter);
      if (status !== filter) await refreshRequests(status);
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
    setUpdating(null);
  };

  const handleReject = async (id) => {
    const note = prompt('Rejection reason (optional):') || '';
    updateStatus(id, 'rejected', note);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSvgFile(null);
    setEditingKey(null);
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setSvgFile(null);
    setEditingKey(null);
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(true);
  };

  const openEdit = async (icon) => {
    setEditingKey(icon.key);
    setForm({
      key: icon.key,
      name: icon.name,
      category: icon.category === 'other' ? 'tool' : icon.category,
      tags: (icon.tags || []).join(', '),
      svgContent: icon.svgContent || '',
      lightBg: icon.themes?.light?.bg || '#F0F0F0',
      lightPrimary: icon.themes?.light?.primary || '#181717',
      darkBg: icon.themes?.dark?.bg || '#181717',
      darkPrimary: icon.themes?.dark?.primary || '#FFFFFF',
    });
    setSvgFile(null);
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(true);

    // List API omits svgContent — load it when opening the editor.
    if (!icon.svgContent) {
      try {
        const { data } = await api.get(`/admin/icons/${icon.key}`);
        const full = data?.icon;
        if (full?.svgContent) {
          setForm((prev) =>
            prev.key === icon.key ? { ...prev, svgContent: full.svgContent } : prev
          );
        }
      } catch (err) {
        setFormError(err.response?.data?.error || 'Failed to load SVG content');
      }
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSvgFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, svgContent: reader.result }));
      }
    };
    reader.readAsText(file);
  };

  const handleSaveIcon = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const category = normalizeCategory(form.category);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(category)) {
      setFormError('Category must be lowercase alphanumeric (hyphens allowed)');
      return;
    }

    setSaving(true);

    try {
      const themes = JSON.stringify({
        light: { bg: form.lightBg, primary: form.lightPrimary },
        dark: { bg: form.darkBg, primary: form.darkPrimary },
        auto: { bg: form.darkBg, primary: form.darkPrimary },
      });

      const body = new FormData();
      if (!editingKey) body.append('key', form.key.trim().toLowerCase());
      body.append('name', form.name.trim());
      body.append('category', category);
      body.append('tags', form.tags);
      body.append('themes', themes);

      if (svgFile) {
        body.append('svg', svgFile);
      } else if (form.svgContent.trim()) {
        body.append('svgContent', form.svgContent.trim());
      }

      if (editingKey) {
        await api.put(`/admin/icons/${editingKey}`, body);
        setFormSuccess(`Updated "${editingKey}"`);
      } else {
        await api.post('/admin/icons', body);
        setFormSuccess(`Created "${form.key.trim().toLowerCase()}"`);
      }

      if (!DEFAULT_CATEGORIES.includes(category)) {
        setCustomCategories((prev) =>
          prev.includes(category) ? prev : [...prev, category]
        );
      }

      await refreshIcons();
      refreshCategories();
      refreshPublicIcons({ invalidateIcons: true });
      setTimeout(resetForm, 700);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const handleAddCategory = () => {
    const category = normalizeCategory(newCategory);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(category)) {
      setFormError('Category must be lowercase alphanumeric (hyphens allowed)');
      return;
    }
    setCustomCategories((prev) =>
      prev.includes(category) ? prev : [...prev, category]
    );
    setForm((prev) => ({ ...prev, category }));
    setNewCategory('');
    setAddingCategory(false);
    setFormError('');
  };

  const categoryOptions = [
    ...orderedCategories,
    ...[...new Set([
      ...DEFAULT_CATEGORIES,
      ...icons.map((icon) => icon.category).filter(Boolean),
      ...customCategories,
      form.category,
    ])].filter((c) => c && c !== 'other' && !orderedCategories.includes(c)),
  ].filter((c) => c && c !== 'other');

  const formatCategoryLabel = (slug) =>
    String(slug)
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const moveCategory = (from, to) => {
    if (from === to || from == null || to == null) return;
    setCategoryList((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const persistCategoryOrder = async (ordered) => {
    setSavingOrder(true);
    setOrderError('');
    setOrderMessage('');
    try {
      await saveCategoryOrder(ordered);
      await refreshPublicIcons({ invalidateIcons: true });
      setOrderMessage('Order saved — gallery filters will use this sequence.');
    } catch (err) {
      setOrderError(err.response?.data?.error || 'Failed to save order');
      await refreshCategories();
    } finally {
      setSavingOrder(false);
    }
  };

  const onCategoryDragStart = (index) => {
    setDragIndex(index);
  };

  const onCategoryDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveCategory(dragIndex, index);
    setDragIndex(index);
  };

  const onCategoryDragEnd = async () => {
    setDragIndex(null);
    const ordered = categoryListRef.current;
    if (ordered.join(',') === orderedCategories.join(',')) return;
    await persistCategoryOrder(ordered);
  };

  const iconCategoryCounts = icons.reduce((acc, icon) => {
    if (icon.category) {
      acc[icon.category] = (acc[icon.category] || 0) + 1;
    }
    return acc;
  }, {});

  const iconFilterCategories = [
    'all',
    ...orderedCategories.filter((c) => iconCategoryCounts[c] > 0),
    ...Object.keys(iconCategoryCounts)
      .filter((c) => c && c !== 'other' && !orderedCategories.includes(c))
      .sort((a, b) => a.localeCompare(b)),
  ];

  useEffect(() => {
    if (iconCategory === 'all') return;
    if (!icons.some((icon) => icon.category === iconCategory)) {
      setIconCategory('all');
    }
  }, [icons, iconCategory]);

  const filteredIcons = icons.filter((icon) => {
    if (iconCategory !== 'all' && icon.category !== iconCategory) return false;
    const q = iconSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      icon.name.toLowerCase().includes(q) ||
      icon.key.toLowerCase().includes(q) ||
      (icon.category || '').toLowerCase().includes(q) ||
      (icon.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const isIconFiltered = iconCategory !== 'all' || Boolean(iconSearch.trim());

  const confirmDeleteIcon = async () => {
    if (!deleteTarget) return;
    const key = deleteTarget.key;
    setDeleting(true);
    try {
      await api.delete(`/admin/icons/${key}`);
      setDeleteTarget(null);
      await refreshIcons();
      refreshPublicIcons({ invalidateIcons: true });
      if (editingKey === key) resetForm();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
    setDeleting(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-full flex flex-col min-h-0">
      <div className="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Upload SVG icons, reorder category filters, and manage community requests.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTab('icons')}
            className={`px-4 py-1.5 rounded-lg border text-sm transition-colors ${
              tab === 'icons'
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setTab('categories')}
            className={`px-4 py-1.5 rounded-lg border text-sm transition-colors ${
              tab === 'categories'
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`px-4 py-1.5 rounded-lg border text-sm transition-colors ${
              tab === 'requests'
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Requests
          </button>
        </div>
      </div>

      {tab === 'icons' ? (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <p className="text-zinc-500 text-sm sm:mr-auto">
              {showIconsLoading
                ? 'Loading…'
                : isIconFiltered
                  ? `${filteredIcons.length} of ${icons.length} icon${icons.length === 1 ? '' : 's'}`
                  : `${icons.length} icon${icons.length === 1 ? '' : 's'} in database`}
            </p>
            <input
              type="text"
              placeholder="Search icons..."
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              className="w-full sm:w-56 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400"
            />
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors shrink-0"
            >
              Upload icon
            </button>
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            {iconFilterCategories.map((cat) => {
              const count = cat === 'all' ? icons.length : (iconCategoryCounts[cat] || 0);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIconCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                    iconCategory === cat
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {showForm && (
            <div
              className="fixed inset-0 bg-black/70 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={resetForm}
              role="dialog"
              aria-modal="true"
              aria-labelledby="icon-form-title"
            >
              <form
                onSubmit={handleSaveIcon}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4 w-full max-w-2xl my-4 sm:my-8 shadow-xl"
              >
                <h2 id="icon-form-title" className="font-semibold text-lg">
                  {editingKey ? `Edit “${editingKey}”` : 'Upload new icon'}
                </h2>
                <p className="text-zinc-500 text-xs">
                  SVG should use placeholders{' '}
                  <code className="text-zinc-700 dark:text-zinc-300">{'{{WIDTH}}'}</code>,{' '}
                  <code className="text-zinc-700 dark:text-zinc-300">{'{{HEIGHT}}'}</code>,{' '}
                  <code className="text-zinc-700 dark:text-zinc-300">{'{{COLOR_BG}}'}</code>,{' '}
                  <code className="text-zinc-700 dark:text-zinc-300">{'{{COLOR_PRIMARY}}'}</code> for theming.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Key
                      {editingKey && (
                        <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
                          (locked — used in URLs)
                        </span>
                      )}
                    </span>
                    <input
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                      placeholder="e.g. react"
                      required
                      disabled={!!editingKey}
                      value={form.key}
                      onChange={(e) => setForm({ ...form, key: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Display name
                    </span>
                    <input
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. React"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Category
                    </span>
                    {!addingCategory ? (
                      <div className="flex gap-2">
                        <select
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          aria-label="Category"
                        >
                          {categoryOptions.map((c) => (
                            <option key={c} value={c}>
                              {formatCategoryLabel(c)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCategory(true);
                            setNewCategory('');
                            setFormError('');
                          }}
                          className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 shrink-0"
                          title="Add category"
                        >
                          + Category
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          placeholder="New category (e.g. devops)"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                          autoFocus
                          aria-label="New category"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="px-3 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 shrink-0"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCategory(false);
                            setNewCategory('');
                          }}
                          className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Tags
                      <span className="ml-1 font-normal text-zinc-400 dark:text-zinc-500">
                        (optional, for search)
                      </span>
                    </span>
                    <input
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. frontend, ui, library"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Light theme</p>
                    <div className="flex gap-2">
                      <label className="flex-1 text-xs text-zinc-400">
                        BG
                        <input
                          type="color"
                          className="mt-1 w-full h-9 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer"
                          value={form.lightBg}
                          onChange={(e) => setForm({ ...form, lightBg: e.target.value })}
                        />
                      </label>
                      <label className="flex-1 text-xs text-zinc-400">
                        Primary
                        <input
                          type="color"
                          className="mt-1 w-full h-9 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer"
                          value={form.lightPrimary}
                          onChange={(e) => setForm({ ...form, lightPrimary: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Dark theme</p>
                    <div className="flex gap-2">
                      <label className="flex-1 text-xs text-zinc-400">
                        BG
                        <input
                          type="color"
                          className="mt-1 w-full h-9 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer"
                          value={form.darkBg}
                          onChange={(e) => setForm({ ...form, darkBg: e.target.value })}
                        />
                      </label>
                      <label className="flex-1 text-xs text-zinc-400">
                        Primary
                        <input
                          type="color"
                          className="mt-1 w-full h-9 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded cursor-pointer"
                          value={form.darkPrimary}
                          onChange={(e) => setForm({ ...form, darkPrimary: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">SVG file</label>
                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={onFileChange}
                    className="block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">
                    Or paste SVG markup {editingKey ? '(leave unchanged to keep current)' : ''}
                  </label>
                  <textarea
                    rows={6}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300"
                    placeholder="<svg ...>{{COLOR_BG}}...</svg>"
                    value={form.svgContent}
                    onChange={(e) => {
                      setSvgFile(null);
                      setForm({ ...form, svgContent: e.target.value });
                    }}
                    required={!editingKey}
                  />
                </div>

                {form.svgContent && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">Preview</span>
                    <div
                      className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: form.svgContent
                          .replace(/\{\{WIDTH\}\}/g, '48')
                          .replace(/\{\{HEIGHT\}\}/g, '48')
                          .replace(/\{\{COLOR_BG\}\}/g, form.darkBg)
                          .replace(/\{\{COLOR_PRIMARY\}\}/g, form.darkPrimary),
                      }}
                    />
                  </div>
                )}

                {formError && <p className="text-red-400 text-sm">{formError}</p>}
                {formSuccess && <p className="text-green-400 text-sm">{formSuccess}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-zinc-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : editingKey ? 'Save changes' : 'Upload to database'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {deleteTarget && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => {
                if (!deleting) setDeleteTarget(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-icon-title"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 w-full max-w-md shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-900/50 flex items-center justify-center text-red-400 text-lg font-bold">
                    !
                  </div>
                  <div className="min-w-0">
                    <h2 id="delete-icon-title" className="font-semibold text-lg">
                      Delete “{deleteTarget.name}”?
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      This will permanently remove{' '}
                      <code className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                        /icons?i={deleteTarget.key}
                      </code>{' '}
                      from the database. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-zinc-900 dark:hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={confirmDeleteIcon}
                    className="px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-500 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Delete icon'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto slim-scroll pr-1">
            {showIconsLoading ? (
              <p className="text-zinc-500">Loading icons…</p>
            ) : icons.length === 0 ? (
              <p className="text-zinc-600">No icons in the database yet.</p>
            ) : filteredIcons.length === 0 ? (
              <p className="text-zinc-600">
                {iconSearch.trim()
                  ? `No icons match “${iconSearch.trim()}”.`
                  : `No icons in “${iconCategory}”.`}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 pb-2">
                {filteredIcons.map((icon) => (
                  <div
                    key={icon.key}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex gap-4"
                  >
                    <img
                      src={icon.previewUrl}
                      alt={icon.name}
                      width={48}
                      height={48}
                      className="rounded-lg shrink-0 self-start w-12 h-12"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{icon.name}</h3>
                        <span className="text-xs text-zinc-500 capitalize">{icon.category}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        /icons?i={icon.key}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => openEdit(icon)}
                          className="px-2.5 py-1 text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(icon)}
                          className="px-2.5 py-1 text-xs border border-red-900 text-red-400 rounded-lg hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tab === 'categories' ? (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="shrink-0">
            <p className="text-zinc-500 text-sm">
              Drag categories to change the filter order on Gallery and Playground. Changes save when you drop.
            </p>
            {savingOrder && <p className="text-zinc-500 text-xs mt-2">Saving order…</p>}
            {orderMessage && <p className="text-green-500 text-xs mt-2">{orderMessage}</p>}
            {orderError && <p className="text-red-500 text-xs mt-2">{orderError}</p>}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto slim-scroll pr-1">
            {showCategoriesLoading ? (
              <p className="text-zinc-500">Loading categories…</p>
            ) : categoryList.length === 0 ? (
              <p className="text-zinc-600">No categories yet. Add icons with a category first.</p>
            ) : (
              <ul className="space-y-2 pb-2 max-w-md">
                {categoryList.map((slug, index) => (
                  <li
                    key={slug}
                    draggable={!savingOrder}
                    onDragStart={() => onCategoryDragStart(index)}
                    onDragOver={(e) => onCategoryDragOver(e, index)}
                    onDragEnd={onCategoryDragEnd}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing select-none transition-colors ${
                      dragIndex === index
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span className="text-zinc-400 text-sm tabular-nums w-6">{index + 1}</span>
                    <span className="text-zinc-500" aria-hidden>
                      ⋮⋮
                    </span>
                    <span className="capitalize font-medium">{slug}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          <div className="flex gap-2 flex-wrap shrink-0">
            {['pending', 'in-progress', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg border text-sm capitalize transition-colors ${
                  filter === s
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto slim-scroll pr-1">
            {showRequestsLoading ? (
              <p className="text-zinc-500">Loading...</p>
            ) : requests.length === 0 ? (
              <p className="text-zinc-600">No {filter} requests.</p>
            ) : (
              <div className="space-y-4 pb-2">
                {requests.map((req) => (
                  <div key={req._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg">{req.iconName}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[req.status]}`}
                          >
                            {req.status}
                          </span>
                          <span className="text-zinc-500 text-sm">▲ {req.upvotes} upvotes</span>
                        </div>
                        <p className="text-zinc-400 text-sm">{req.description}</p>
                        {req.referenceUrl && (
                          <a
                            href={req.referenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-yellow-400 text-xs hover:underline"
                          >
                            {req.referenceUrl}
                          </a>
                        )}
                        <p className="text-zinc-600 text-xs mt-2">
                          By {req.submitterName || 'Anonymous'} · {req.submitterEmail} ·{' '}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        {req.adminNote && (
                          <p className="text-zinc-500 text-xs mt-1 italic">Note: {req.adminNote}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {req.status !== 'in-progress' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(req._id, 'in-progress')}
                          disabled={updating === req._id}
                          className="px-3 py-1.5 text-xs border border-blue-700 text-blue-400 rounded-lg hover:bg-blue-900/30 disabled:opacity-50"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {req.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(req._id, 'approved')}
                          disabled={updating === req._id}
                          className="px-3 py-1.5 text-xs border border-green-700 text-green-400 rounded-lg hover:bg-green-900/30 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {req.status !== 'rejected' && (
                        <button
                          type="button"
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
        </div>
      )}
    </div>
  );
}
