# WearWorth Launch Checklist

Updated: 2026-07-14

## Final Pre-Production Status - 2026-07-14

### Completed
- Required repository paths are present.
- Production build passes with Next.js 16.2.10.
- Prisma schema validation passes with Prisma 6.19.3.
- Prisma Client generation passes after clearing a local Windows file lock from the running WearWorth server.
- MongoDB schema was updated additively with `SavedCartItem` and `WishlistItem` collections and indexes.
- Product data verification passes for 54 products.
- Product data verification now checks duplicate slugs/SKUs, missing required metadata, invalid prices, negative stock, and missing images.
- Guest cart and wishlist still work through localStorage.
- Signed-in users now get server-backed cart and wishlist persistence with guest merge after login.
- Saved cart sync ignores inactive, draft, missing, out-of-stock, invalid-variant, and invalid-quantity items.
- Saved wishlist sync ignores inactive, draft, missing, and duplicate products.
- Logout clears account-specific cart/wishlist client state to avoid cross-user leakage.
- Admin order API now supports server-side pagination, search, order-status filter, and payment-status filter.
- Admin dashboard now includes order search/filter controls, paginated order results, loading state, and filtered empty state.
- Profile, address, admin product, admin order, saved cart, and saved wishlist mutation APIs now have lightweight rate limiting.
- Forgot-password no longer exposes email-provider configuration state or claims a reset email was sent.
- Cart currency/quote rendering was cleaned up in touched cart UI.
- Coupon UI remains honest and disabled until server-side rules exist.
- Fake reviews/ratings remain absent.

### Blocked by credentials
- Password-reset email delivery requires approved email-provider credentials such as `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, or equivalent configured provider names.
- Newsletter persistence or delivery requires an approved newsletter/email provider or database destination.
- Contact form delivery requires an approved support inbox/provider.
- Cloudinary upload/delete still needs live verification with the owner's production Cloudinary account.
- Production environment variables and domain configuration must be reviewed by the owner without exposing values.

### Requires owner approval
- Final shipping policy wording.
- Final return, exchange, cancellation, and refund wording.
- Final privacy policy and terms wording.
- Official support email, phone, WhatsApp, address, and support hours.
- Final size-guide measurements by garment category.
- Company/legal identity text, if required.
- Production launch approval after manual QA.

### Requires business rules
- Coupon type, minimum order value, maximum discount, expiry, total usage limit, per-user usage limit, product/category exclusions, stacking rules, and COD eligibility.
- Review/rating verified-buyer rules, moderation workflow, edit/delete rules, duplicate prevention, ownership rules, and publication states.
- Shipping zones, courier process, free-shipping threshold, delay handling, and delivery-estimate rules.
- Return/exchange request workflow, eligibility, pickup charges, replacement/store-credit/refund handling, and cancellation cutoff.
- Order status transition rules and whether status history/audit logs are required.

### Requires manual browser testing
- Desktop, tablet, and mobile pass for homepage, products, product detail, collections, cart, wishlist, checkout, order success, orders, order details, profile, security, addresses, login, register, forgot/reset password, admin product manager, admin order manager, support pages, and footer.
- Keyboard navigation and focus visibility across navigation, search drawer, forms, filters, admin controls, and status selectors.
- Real account cart/wishlist merge after login, refresh persistence, logout clearing, and cross-user separation.
- COD checkout with synced cart, saved address, stock reduction, order visibility, and admin status update.
- Live Cloudinary upload/delete with owner credentials.

### Not started intentionally
- Razorpay or any online payment integration.
- Shipping-provider integrations.
- Invented tracking numbers.
- Deployment or hosting changes.
- Coupons without approved rules.
- Reviews without approved moderation rules.
- Unrelated redesigns.
- Prisma v7 upgrade.

## Deep Study - Current Pending Work

### Corrections Found And Fixed In This Pass
- Checkout formatting was broken because `app/styles/checkout.css` was empty while the checkout page already depended on those classes.
- Checkout now has scoped responsive styling for the hero, checkout steps, delivery cards, COD payment card, saved-address cards, order summary, totals, and mobile layout.
- Customer-care and legal routes now exist for Shipping, Returns, Size Guide, FAQs, Contact, Privacy, and Terms.
- Footer customer-care links now point to dedicated pages instead of sending every item to `/about`.
- SEO basics now exist with `sitemap.ts`, `robots.ts`, canonical metadata, and basic Open Graph/Twitter image metadata.
- Global production states now exist with custom `error.tsx`, `not-found.tsx`, and `loading.tsx`.
- Cart and checkout now call a server-side reconciliation API before checkout/order placement to refresh product price, status, variant, and stock data from MongoDB.
- Product cards now route shoppers to the product detail page for products with multiple sizes or colors instead of silently adding a default variant.
- Removed stale fake-coupon form CSS while keeping the honest coupon-pending message.
- Navbar search now submits to the product catalogue instead of acting as a visual-only drawer.
- Product catalogue links now support URL-driven search, audience, category, and sort state on initial page load.
- Men, Women, footer, collections, and homepage chapter links now route to filtered catalogue views where possible.
- Product detail wishlist state now uses the shared wishlist provider.
- Homepage newsletter signup now validates email and clearly reports that an email provider is still required before addresses can be saved.
- Auth, password, order creation, and admin image upload/delete APIs now have lightweight in-memory rate limiting.
- Obvious text encoding issues in touched metadata/footer/collections copy were cleaned up.

### Corrections Still Pending
- Customer-care and legal pages still need final owner-approved policy copy, official support contact details, and business/legal review before public launch.
- Cart and wishlist remain browser-local only; logged-in account sync is not implemented.
- Coupons are intentionally display-only/pending; no server-side coupon model, validation API, usage limit, or admin coupon manager exists.
- Product reviews and real ratings are not implemented.
- Category, collection, coupon, review, order-status-history, return/exchange, audit-log, and notification-preference models do not exist yet.
- Admin order management supports recent orders and status updates, but still needs deeper filtering, pagination, details, status history, exports, and tracking notes.
- Cloudinary upload/delete needs live verification against the owner's account.
- Email delivery is not configured locally; password reset email sending remains blocked until a real provider and credentials are configured.
- Newsletter capture is not connected to a provider or database yet.
- Production-grade distributed rate limiting or WAF rules still require hosting/infrastructure decisions.
- Full accessibility and responsive QA still needs a manual browser pass across desktop, tablet, and mobile.

### Tasks Codex Can Do Directly
- Replace owner-review support page copy with final approved customer-care/legal content when provided.
- Connect a real contact form or support inbox after the official support destination is confirmed.
- Add account-synced cart and wishlist storage while preserving current localStorage behavior as a fallback.
- Add category/collection/coupon/review models, APIs, admin UI, and storefront UI after rules are approved.
- Add admin order filters, pagination, order detail view, status history, notes, and export tooling.
- Add low-stock reports, product data maintenance scripts, and manual QA scripts.
- Connect newsletter signup to an approved email provider or database table once the owner confirms the destination.

### Tasks That Need Owner Decisions Or Credentials
- Final policy wording for shipping, returns, exchanges, cancellations, privacy, terms, contact, FAQ, and size guide.
- Tax, invoice, shipping-zone, free-shipping, delivery-estimate, and discount business rules.
- Coupon eligibility, usage limits, stackability, expiry, COD compatibility, and abuse-prevention rules.
- Review/rating moderation rules and whether only verified buyers can review.
- Real email provider configuration, sender identity, templates, and deliverability testing.
- Newsletter provider/list destination and consent wording.
- Live Cloudinary upload/delete testing with the owner's configured account.
- Vercel production environment review, domain settings, and production smoke testing.

### Tasks Intentionally Not Started
- Razorpay, Stripe, PayPal, UPI, card, wallet, webhook, refund, and payment reconciliation work.
- Deployment changes.
- Analytics integrations.
- Unrelated authentication refactors.
- Any automated destructive production-data cleanup.

## Completed
- Production build passes with Next.js 16.2.10.
- Prisma Client generation passes with Prisma 6.19.3.
- MongoDB product data verification passes for 54 products.
- Legacy product data backfill completed for missing SKU, audience, colors, material, fit, wash care, product status, and low-stock threshold.
- Duplicate product slug and SKU check passes.
- Sample product seed UI, seed API route, generated sample data, and sample import/sync scripts are removed from active code.
- Cash on Delivery remains the only enabled checkout payment method.
- Browser-only fake coupon discount is removed until server-side coupon validation exists.
- Fake product star ratings are removed from product cards and product detail pages.
- Admin product, upload, order, authentication, profile, address, cart, wishlist, checkout, and order code paths remain in place.
- Navbar search, product URL filters, collection/chapter catalogue links, product detail wishlist sync, and newsletter transparency have been cleaned up.

## Needs Manual Testing
- Home page, product catalogue, product detail, collections, about, cart, wishlist, checkout, order success, orders, order detail, profile, security, addresses, login, register, forgot/reset password, and admin dashboard.
- Product CRUD from admin, including add, edit, delete confirmation, draft/publish, filters, pagination, image upload, primary image selection, and gallery removal.
- COD checkout with real user account, saved address, stock reduction, order visibility, and admin order status update.
- Mobile layout checks for products, cart, checkout, account pages, orders, and admin.
- Basic keyboard navigation and focus visibility across forms, drawers, menus, and admin controls.

## Credential-Dependent
- Cloudinary upload/delete must be verified against the owner's configured Cloudinary account.
- Email delivery is not configured locally because `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are not present; forgot-password remains architecture-only until credentials/provider setup is complete.
- Vercel production environment variables must be checked by the owner without exposing secret values.

## Business/Legal Decision Required
- Category and collection taxonomy, active/inactive rules, safe reassignment behavior, and navigation labels.
- Coupon rules, discount limits, usage limits, category/product applicability, and COD compatibility.
- Shipping charges, free-shipping threshold, delivery estimates, and zone rules.
- Tax display and calculation policy must be reviewed by the business owner/accountant.
- Contact, FAQ, shipping policy, return/exchange policy, privacy policy, terms and conditions, size guide, and care guide content need owner/legal review before launch.
- Cancellation, return, and exchange request rules need operational approval.
- Review/rating policy must define who can review, whether an order is required, moderation rules, and duplicate-review rules.

## Payment Intentionally Pending
- Razorpay, Stripe, PayPal, UPI, cards, wallets, payment webhooks, online payment verification, refunds, and reconciliation are intentionally not implemented.
- The app currently supports Cash on Delivery orders only.
- Future online payment work should be added through a server-verified gateway flow that never trusts browser totals.

## Safe Maintenance Commands
- `npm.cmd install`
- `npx.cmd prisma format`
- `npx.cmd prisma validate`
- `npx.cmd prisma generate`
- `npm.cmd run db:verify-products`
- `node scripts/backfill-legacy-products.mjs` for dry-run only
- `npm.cmd run db:backfill-products` only when a reviewed dry-run shows safe missing-field updates
- `npm.cmd run build`
