# MediCare+ UI Enhancements Remaining Issues

## 1. Manual browser visual regression

**Status:** Not executed in this session.

**Reproduction / verification steps:**

1. Start the backend and Angular application with a seeded development database.
2. Verify date controls and calendar focus order at desktop, tablet, and mobile widths.
3. Verify all modal headers, body scrolling, fixed footers, long titles, and Arabic RTL.
4. Exercise Notifications search, filters, mark-read, mark-all, dismiss, pagination, and header count synchronization.
5. Exercise Documents Preview/Download from first, middle, and last table rows.
6. Verify Inventory/Purchase Order placeholders in create and edit flows.
7. Verify Nursing Shift Handover submission with optional and required fields.
8. Verify Support modal status updates and toolbar stacking.
9. Upload, replace, refresh, and delete a hospital logo using the configured production storage driver.

**Recommended next action:** Run Playwright browser regression tests against a disposable database containing synthetic data.

## 2. Native date-picker popup appearance

**Status:** Platform-dependent by browser design.

The input surface, focus, disabled, error, icon, RTL, and sizing states are standardized globally. The interior popup of native `date` and `datetime-local` controls remains browser/OS rendered. The application’s custom `AppCalendar` provides the fully themed calendar where used.

**Recommended next action:** If identical popup internals across every browser become mandatory, plan a separate migration of all native date inputs to a shared overlay-based date-control component, with dedicated form-control and accessibility regression coverage.

## 3. SCSS component budget warnings

**Status:** Non-blocking build warnings.

The Angular production build currently reports style-budget warnings for existing large components, including Support, Settings, Authentication, Aira, Main Layout, and Billing form styles.

**Recommended next action:** Extract repeated component rules into shared global partials in a dedicated CSS-budget cleanup task, then lower component-local style sizes without changing visual behavior.

## 4. Deployment

**Status:** Not performed.

Source changes and backend endpoints are implemented locally. Production behavior requires deploying the frontend/backend build. No schema migration is needed.
