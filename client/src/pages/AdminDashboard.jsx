import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useIcons } from '../context/IconsContext';
import ColorField from '../components/ColorField';
import api from '../utils/api';
import { resolveServerUrl } from '../utils/serverUrl';
import { normalizeHex } from '../utils/color';

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

/** Visible icons per "page" — each card also hits /icons?i=… for its thumbnail. */
const ADMIN_ICONS_PAGE_SIZE = 20;

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

function formsEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.key === b.key &&
    a.name === b.name &&
    a.category === b.category &&
    a.tags === b.tags &&
    a.svgContent === b.svgContent &&
    normalizeHex(a.lightBg) === normalizeHex(b.lightBg) &&
    normalizeHex(a.lightPrimary) === normalizeHex(b.lightPrimary) &&
    normalizeHex(a.darkBg) === normalizeHex(b.darkBg) &&
    normalizeHex(a.darkPrimary) === normalizeHex(b.darkPrimary)
  );
}

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
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
    cacheIconSvg,
    getIconSvg,
    removeIconFromCache,
    prefetchIconDetails,
    prefetchIconsDetails,
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
  const [visibleCount, setVisibleCount] = useState(ADMIN_ICONS_PAGE_SIZE);
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
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const categoryListRef = useRef(categoryList);
  categoryListRef.current = categoryList;
  /** Snapshot of form when edit opened / last silent hydrate — used to disable Save when unchanged. */
  const formBaselineRef = useRef(null);

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
    formBaselineRef.current = null;
    setForm(emptyForm);
    setSvgFile(null);
    setEditingKey(null);
    setEditPreviewUrl('');
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(false);
  };

  const openCreate = () => {
    formBaselineRef.current = null;
    setForm(emptyForm);
    setSvgFile(null);
    setEditingKey(null);
    setEditPreviewUrl('');
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(true);
  };

  const openEdit = (icon) => {
    // Always prefer the latest hydrated entry from context (category tabs share the same list).
    const latest = icons.find((item) => item.key === icon.key) || icon;
    const cachedSvg = latest.svgContent || getIconSvg(latest.key) || '';
    const previewUrl =
      latest.previewUrl || `/icons?i=${latest.key}&theme=dark&width=48&height=48`;

    const nextForm = {
      key: latest.key,
      name: latest.name,
      category: latest.category === 'other' ? 'tool' : latest.category,
      tags: (latest.tags || []).join(', '),
      svgContent: cachedSvg,
      lightBg: latest.themes?.light?.bg || '#F0F0F0',
      lightPrimary: latest.themes?.light?.primary || '#181717',
      darkBg: latest.themes?.dark?.bg || '#181717',
      darkPrimary: latest.themes?.dark?.primary || '#FFFFFF',
    };

    setEditingKey(latest.key);
    setEditPreviewUrl(previewUrl);
    formBaselineRef.current = nextForm;
    setForm(nextForm);
    setSvgFile(null);
    setFormError('');
    setFormSuccess('');
    setAddingCategory(false);
    setNewCategory('');
    setShowForm(true);

    // Silent revalidate — only patch fields that actually changed.
    prefetchIconDetails(latest.key, { force: true }).then((full) => {
      if (!full) return;
      if (full.previewUrl) setEditPreviewUrl(full.previewUrl);
      setForm((prev) => {
        if (prev.key !== latest.key) return prev;
        const patched = {
          ...prev,
          name: full.name ?? prev.name,
          category:
            full.category === 'other' ? 'tool' : full.category || prev.category,
          tags: Array.isArray(full.tags) ? full.tags.join(', ') : prev.tags,
          svgContent: full.svgContent ?? prev.svgContent,
          lightBg: full.themes?.light?.bg || prev.lightBg,
          lightPrimary: full.themes?.light?.primary || prev.lightPrimary,
          darkBg: full.themes?.dark?.bg || prev.darkBg,
          darkPrimary: full.themes?.dark?.primary || prev.darkPrimary,
        };
        if (formsEqual(patched, prev)) return prev;
        // Advance baseline only when the user hasn't edited yet.
        if (formBaselineRef.current && formsEqual(prev, formBaselineRef.current)) {
          formBaselineRef.current = patched;
        }
        return patched;
      });
    });
  };

  // If batch prefetch finishes while the edit modal is open, fill empty SVG only.
  useEffect(() => {
    if (!showForm || !editingKey) return;
    const latest = icons.find((item) => item.key === editingKey);
    if (!latest) return;

    if (latest.previewUrl) {
      setEditPreviewUrl((prev) => prev || latest.previewUrl);
    }
    if (!latest.svgContent) return;

    setForm((prev) => {
      if (prev.key !== editingKey || prev.svgContent) return prev;
      const next = { ...prev, svgContent: latest.svgContent };
      if (formBaselineRef.current && formsEqual(prev, formBaselineRef.current)) {
        formBaselineRef.current = next;
      }
      return next;
    });
  }, [icons, editingKey, showForm]);

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

  const isFormDirty =
    Boolean(svgFile) || !formsEqual(form, formBaselineRef.current);

  const handleSaveIcon = async (e) => {
    e.preventDefault();
    if (editingKey && !isFormDirty) return;
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
        if (form.svgContent.trim()) cacheIconSvg(editingKey, form.svgContent.trim());
        setFormSuccess(`Updated "${editingKey}"`);
      } else {
        const createdKey = form.key.trim().toLowerCase();
        await api.post('/admin/icons', body);
        if (form.svgContent.trim()) cacheIconSvg(createdKey, form.svgContent.trim());
        setFormSuccess(`Created "${createdKey}"`);
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

  useEffect(() => {
    setVisibleCount(ADMIN_ICONS_PAGE_SIZE);
  }, [iconCategory, iconSearch]);

  const visibleIcons = filteredIcons.slice(0, visibleCount);
  const hasMoreIcons = visibleCount < filteredIcons.length;
  const canShowLessIcons = visibleCount > ADMIN_ICONS_PAGE_SIZE;
  const visibleIconKeys = visibleIcons.map((icon) => icon.key).join(',');

  // Warm SVG cache for visible cards so Edit opens fully prefilled (no wait).
  useEffect(() => {
    if (tab !== 'icons' || !visibleIconKeys) return;
    prefetchIconsDetails(visibleIconKeys.split(','));
  }, [tab, visibleIconKeys, prefetchIconsDetails]);

  const loadMoreIcons = () => {
    setVisibleCount((count) =>
      Math.min(count + ADMIN_ICONS_PAGE_SIZE, filteredIcons.length)
    );
  };

  const showLessIcons = () => {
    setVisibleCount((count) =>
      Math.max(ADMIN_ICONS_PAGE_SIZE, count - ADMIN_ICONS_PAGE_SIZE)
    );
  };

  const isIconFiltered = iconCategory !== 'all' || Boolean(iconSearch.trim());

  const confirmDeleteIcon = async () => {
    if (!deleteTarget) return;
    const key = deleteTarget.key;
    setDeleting(true);
    try {
      await api.delete(`/admin/icons/${key}`);
      setDeleteTarget(null);
      removeIconFromCache(key);
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
        {tab === 'icons' && (
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors shrink-0 self-start sm:self-auto"
          >
            Upload icon
          </button>
        )}
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
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full sm:w-56 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400"
              />
              {iconSearch && (
                <button
                  type="button"
                  onClick={() => setIconSearch('')}
                  className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
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
                <div className="flex items-start gap-3">
                  {(editingKey || form.svgContent || editPreviewUrl) && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      {form.svgContent ? (
                        <div
                          className="w-12 h-12 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full"
                          dangerouslySetInnerHTML={{
                            __html: form.svgContent
                              .replace(/\{\{WIDTH\}\}/g, '48')
                              .replace(/\{\{HEIGHT\}\}/g, '48')
                              .replace(/\{\{COLOR_BG\}\}/g, form.darkBg)
                              .replace(/\{\{COLOR_PRIMARY\}\}/g, form.darkPrimary),
                          }}
                        />
                      ) : (
                        <img
                          src={resolveServerUrl(
                            editPreviewUrl ||
                              `/icons?i=${editingKey || form.key}&theme=dark&width=48&height=48`
                          )}
                          alt={form.name || editingKey || 'Icon'}
                          width={48}
                          height={48}
                          className="w-12 h-12"
                        />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 id="icon-form-title" className="font-semibold text-lg">
                      {editingKey ? `Edit “${editingKey}”` : 'Upload new icon'}
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1">
                      SVG should use placeholders{' '}
                      <code className="text-zinc-700 dark:text-zinc-300">{'{{WIDTH}}'}</code>,{' '}
                      <code className="text-zinc-700 dark:text-zinc-300">{'{{HEIGHT}}'}</code>,{' '}
                      <code className="text-zinc-700 dark:text-zinc-300">{'{{COLOR_BG}}'}</code>,{' '}
                      <code className="text-zinc-700 dark:text-zinc-300">{'{{COLOR_PRIMARY}}'}</code> for theming.
                    </p>
                  </div>
                </div>

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
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Dark theme</p>
                    <div className="flex gap-2">
                      <ColorField
                        label="BG"
                        value={form.darkBg}
                        onChange={(hex) => setForm((prev) => ({ ...prev, darkBg: hex }))}
                      />
                      <ColorField
                        label="Primary"
                        value={form.darkPrimary}
                        onChange={(hex) => setForm((prev) => ({ ...prev, darkPrimary: hex }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Light theme</p>
                    <div className="flex gap-2">
                      <ColorField
                        label="BG"
                        value={form.lightBg}
                        onChange={(hex) => setForm((prev) => ({ ...prev, lightBg: hex }))}
                      />
                      <ColorField
                        label="Primary"
                        value={form.lightPrimary}
                        onChange={(hex) => setForm((prev) => ({ ...prev, lightPrimary: hex }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">
                    Paste SVG markup {editingKey ? '(leave unchanged to keep current)' : ''}
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

                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Or upload SVG file</label>
                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={onFileChange}
                    className="block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200"
                  />
                </div>

                {form.svgContent && (
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-zinc-500">Live preview</span>
                    {[
                      { label: 'Dark', bg: form.darkBg, primary: form.darkPrimary },
                      { label: 'Light', bg: form.lightBg, primary: form.lightPrimary },
                    ].map((theme) => (
                      <div key={theme.label} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{theme.label}</span>
                        <div
                          className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 [&_svg]:max-w-full [&_svg]:max-h-full"
                          dangerouslySetInnerHTML={{
                            __html: form.svgContent
                              .replace(/\{\{WIDTH\}\}/g, '48')
                              .replace(/\{\{HEIGHT\}\}/g, '48')
                              .replace(/\{\{COLOR_BG\}\}/g, theme.bg)
                              .replace(/\{\{COLOR_PRIMARY\}\}/g, theme.primary),
                          }}
                        />
                      </div>
                    ))}
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
                    disabled={saving || (editingKey && !isFormDirty)}
                    className="px-4 py-2 text-sm bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <>
                <div className="grid sm:grid-cols-2 gap-3 pb-2">
                  {visibleIcons.map((icon) => (
                    <div
                      key={icon.key}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex gap-4"
                    >
                      <img
                        src={resolveServerUrl(icon.previewUrl)}
                        alt={icon.name}
                        width={48}
                        height={48}
                        className="rounded-lg shrink-0 self-start w-12 h-12"
                        loading="lazy"
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

                {(hasMoreIcons || canShowLessIcons) && (
                  <div className="flex justify-center gap-3 mt-4 pb-2">
                    {canShowLessIcons && (
                      <button
                        type="button"
                        onClick={showLessIcons}
                        className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:border-zinc-400 dark:hover:border-zinc-500"
                      >
                        Show less
                      </button>
                    )}
                    {hasMoreIcons && (
                      <button
                        type="button"
                        onClick={loadMoreIcons}
                        className="px-5 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300"
                      >
                        Load more ({visibleIcons.length} of {filteredIcons.length})
                      </button>
                    )}
                  </div>
                )}
              </>
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
