# Reusable Components Plan

Lean extractions across the MyIconix client. UI and behavior stay identical — copy Tailwind strings as-is, no design-system overbuild.

## Inventory counts

| Kind | Count | What |
|------|------:|------|
| Website pages | **8** | Home, Gallery, Playground, RequestIcon, AdminLogin, AdminDashboard, AdminDetails |
| Shared components (before) | **6** | Navbar, Footer, ColorField, PasswordInput, UpvoteModal, AdminRoute |
| New reusable pieces | **5** | CategoryPills, PaginationControls, UserIcon, `formClasses`, `useDebouncedValue` |
| Files updated for wiring | **7** | Gallery, Playground, RequestIcon, UpvoteModal, Navbar, AdminDetails, AdminDashboard |
| Pages left untouched | **2** | Home, AdminLogin |

**After this pass:** ~9 shared components (6 existing + 3 new), plus 1 form-class module and 1 debounce hook.

## Page-by-page

| Page | Action |
|------|--------|
| Home | No extract — unique hero/layout |
| Gallery | CategoryPills, PaginationControls, formClasses, useDebouncedValue |
| Playground | Same as Gallery |
| RequestIcon | formClasses only (already uses UpvoteModal) |
| AdminLogin | Untouched (already uses PasswordInput) |
| AdminDashboard | CategoryPills + PaginationControls as consumer only — **no file split** |
| AdminDetails | UserIcon |
| Navbar | UserIcon |

## Created

1. **`CategoryPills`** — yellow/zinc filter pills; optional active class for Playground’s `font-medium`
2. **`PaginationControls`** — Show less / Show more (or Load more); padding/wrapper via props
3. **`UserIcon`** — shared SVG used by Navbar + AdminDetails
4. **`utils/formClasses.js`** — shared `fieldClass` string
5. **`hooks/useDebouncedValue`** — 400ms search debounce for Gallery + Playground

## Explicitly not built

- Button / Input / Select design system
- Generic Modal shell
- Unified IconGrid
- Shared RequestCard / PageHeader / SurfaceCard / EmptyState
- AdminDashboard structural split

## Integrity checklist

- [x] Extractions wired: CategoryPills, PaginationControls, UserIcon, formClasses, useDebouncedValue
- [x] README refreshed for current API / seed / deploy
- [x] `cd client && npm run lint`
- [ ] Manual smoke: Gallery search/categories/pagination/modal
- [ ] Manual smoke: Playground select + copy URL
- [ ] Manual smoke: Request submit + upvote
- [ ] Manual smoke: Admin icons filter + load more
- [ ] Manual smoke: Admin Details + Navbar avatar fallback
