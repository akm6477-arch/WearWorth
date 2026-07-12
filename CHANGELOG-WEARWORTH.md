# WearWorth Change Log

## Files Changed
- `prisma/schema.prisma`
- `.env.example`
- `lib/auth.ts`
- `lib/catalog.ts`
- `lib/catalog-types.ts`
- `lib/products.ts`
- `lib/routes.ts`
- `middleware.ts`
- `app/globals.css`
- `app/components/Navbar.tsx`
- `app/login/page.tsx`
- `app/checkout/page.tsx`
- `app/profile/page.tsx`
- `app/api/auth/me/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/change-password/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/addresses/route.ts`
- `app/api/addresses/[id]/route.ts`
- `app/api/orders/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/products/seed/route.ts`
- `app/api/admin/uploads/route.ts`
- `app/api/products/route.ts`
- `app/api/products/[slug]/route.ts`
- `app/forgot-password/page.tsx`
- `app/reset-password/page.tsx`
- `app/profile/security/page.tsx`
- `app/addresses/page.tsx`
- `app/orders/page.tsx`
- `app/orders/[id]/page.tsx`
- `app/order-success/page.tsx`
- `app/admin/page.tsx`
- `app/page.tsx`
- `app/products/page.tsx`
- `app/products/[slug]/page.tsx`
- `app/wishlist/page.tsx`
- `lib/cloudinary.ts`
- `lib/generated-products.ts`

## Features Completed
- Fixed the Next.js build blocker on `/login` by wrapping search-param usage in `Suspense`.
- Added safe internal redirect sanitization for login redirects.
- Cleared invalid auth cookies through the `/api/auth/me` and logout flows.
- Updated the existing navbar to reflect auth state without removing cart, wishlist, search, dropdowns, or mobile drawer behavior.
- Added admin link handling in desktop and mobile navigation.
- Added password-change API and protected UI at `/profile/security`.
- Added forgot-password and reset-password architecture with safe server routes and user-facing pages.
- Added `Address` and `PasswordResetToken` Prisma models.
- Added address CRUD APIs and `/addresses` management page with default-address behavior.
- Connected saved addresses into checkout for quick address reuse.
- Replaced the temporary frontend-only checkout mock with a server-side COD order creation flow.
- Added richer `Order` fields in Prisma for order number, subtotal, shipping, discount, delivery method, payment method, and status tracking.
- Added protected `/orders` and `/orders/[id]` pages backed by server APIs that restrict normal users to their own orders.
- Added protected `/admin` dashboard foundation plus admin order API access.
- Added DB-backed catalogue helpers with static fallback when MongoDB is unavailable.
- Added product listing and product-detail APIs, including slug-based product fetch.
- Switched homepage featured products, products archive, product detail page, and wishlist to shared catalogue data instead of static-only rendering.
- Added protected admin product create, edit, and delete APIs plus a usable admin product manager UI.
- Added product `collection`, `images`, `sizes`, `stock`, and `featured` handling for catalogue management.
- Added protected Cloudinary image upload API plus admin upload controls that attach image URLs and stored public IDs to products.
- Added Cloudinary cleanup on admin product update/delete so removed product images do not stay orphaned.
- Added a one-click admin sample catalog importer with 50 editable starter products.
- Kept the current `npm run dev` script on webpack and verified that the app starts.

## Commands Run
- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma db push`
- `npm run build`
- `npm run dev`
- `npx prisma db push`
- `npx prisma format`
- `npx prisma validate`
- `npx prisma generate`
- `npm run build`

## Remaining Credential-Dependent Tasks
- Email delivery for forgot-password still requires provider credentials such as `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Razorpay is not connected yet, so COD is the only real checkout flow.
- Cloudinary still needs real credentials in `.env` before the upload button can work on this machine.

## Known Limitations
- The admin area is a protected working foundation, not the full multi-screen catalog/order/customer suite from the later sprints.
- Razorpay payment verification is still pending.
- Admin product writes depend on MongoDB availability; when Atlas is unreachable, catalogue reads fall back to static data but product create/update/delete are blocked.
- Next.js 16 still shows the deprecation warning for `middleware.ts`; it does not block builds, but migrating to the newer `proxy` convention is still advisable.
