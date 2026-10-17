# Vendor onboarding: admin creates vendors, vendors sell under their brand

Date: 2026-10-17. Covers both repos: `discount-ecommerce-api` (Django/DRF) and
`discount-ecommerce-frontend` (Vite/React).

## Why

GrottoMore wants other businesses (vendors) to sell products under their own
brand. Today the admin is the only real product creator. Vendors can sign
themselves up and wait for approval, but nothing about that feels controlled or
finished, and shoppers never see which brand sells a product. The owner wants
to keep a human in the loop: a business gets in touch, GrottoMore sets them up,
and from then on the vendor manages their own products.

## Goals

1. A business can get in touch through a public **"Sell on GrottoMore"** form.
   This sends a request. It does not create an account.
2. An admin turns a request (or a contact made offline) into a vendor. Creating
   the vendor also creates the vendor's login and emails them an invite link.
3. The vendor opens the link, sets a password, and lands on their dashboard,
   ready to add products.
4. A vendor's products **go live straight away**, with no admin approval, and
   shoppers see "Sold by <Brand>".
5. An admin can assign any existing product to a vendor. Products without a
   vendor stay GrottoMore's own.

## Non-goals

- Vendors seeing orders, sales reports, or payouts. Customers keep paying into
  GrottoMore's accounts as they do now.
- Vendor bulk upload. The current bulk-upload tab fails for vendors because the
  endpoint is admin-only, so the tab is hidden for vendors.
- More than one login per vendor.
- Rich HTML emails. Plain text through the existing `send_email` helper is enough.

## Anti-goals

These would count as failures even if the feature technically works.

- Buyer signup changes in any way. The normal buyer registration must stay as
  it is. Only the "I'm a vendor" path changes.
- Anyone gets a vendor login without an admin creating it.
- A vendor can touch another vendor's products, choose which vendor a product
  belongs to, or mark products as featured.

## Current state (what to build on)

### Backend

The paths below are under `api/`.

- **Roles.** `users.User.Role` includes `vendor_admin`. `User.vendor` is an FK
  with `related_name="admins"`.
- **Vendor model.** `vendors.Vendor` has `name` (unique), `slug`, `status`
  (pending/approved/rejected/suspended), `business_email`, `phone`, `address`,
  `logo`, `website` and `about`.
- **Vendor endpoints** (`vendors/urls.py`):
  - list, `me/`, `signup/` (public self-signup), detail/edit, and
    approve/reject/suspend.
  - There is no admin create endpoint.
- **Product creation.** `products/views.py` already forces `vendor=user.vendor`
  when a `vendor_admin` creates a product. It also scopes the vendor's
  list/edit/delete to their own products.
- **Vendor permission.** `IsApprovedVendorAdmin` (in `common/permissions.py`)
  requires the vendor to be approved.
- **Product serializers.**
  - `ProductCreateSerializer` has no `vendor` field, so nobody can assign a
    vendor through the API today.
  - `ProductReadSerializer` doesn't expose the vendor at all.
  - A vendor can set `is_featured`.
- **Shopper visibility.** The shopper product list and detail filter only
  `is_deleted=False`. They show draft and archived products, and products of
  suspended vendors.
- **Password reset.** `users/views.py` has a password-reset flow:
  - `password-reset/` emails a link built with `default_token_generator`.
  - `password-reset-confirm/` takes `uid`, `token` and `new_password`.
  - The link is hardcoded to `http://localhost:8000/reset-password-confirm/...`.
  - Confirm doesn't run `validate_password`.
- **Notifications.** `notifications/services.py` has `get_platform_admins()`,
  `notify_admins_vendor_signup` and `notify_vendor_status_change`. These create
  in-app notifications and send plain-text emails.
- **Email.** It now goes out through Resend SMTP from
  `GrottoMore <noreply@grottomore.com>`.
- **Production data.** Production has 2 `vendor_admin` accounts from
  self-signup, created Oct 13–14 and pending or approved. They must keep
  working.

### Frontend

- **Registration.** `Register.tsx` shows "I'm shopping" and "I'm a vendor"
  (`?as=vendor`). The vendor choice renders `VendorRegisterForm`, which posts
  to `/vendors/signup/`.
- **Footer.** It links "List your deals as a vendor" to `/register?as=vendor`.
- **Admin vendors tab.** `VendorManager.tsx` (Admin `?tab=vendors`) lists,
  approves, rejects, suspends, views and edits vendors. It has no create
  button.
- **Vendor dashboard.** `VendorDashboard.tsx` (`/vendor`) has overview,
  products (`VendorProductsPanel` → the shared `ProductManager` plus a bulk
  upload tab) and store profile. It only checks "logged in", not the role.
- **Product form.** `ProductManager.tsx` is shared by admin and vendor. It has
  an `is_featured` checkbox and no vendor selector.
- **"Sold by".** `ProductDetail.tsx` shows "Sold by" using `retailerName()` in
  `lib/deal.ts`. It never shows the real vendor name.
- **Missing pages.** There is no set-password or forgot-password page.

## The flow

1. **Get in touch.** "I'm a vendor" on the register page, and the footer link,
   both go to a new public page at **`/sell`**.
   - The form asks for: business name, contact name, email, phone, what they
     sell, and an optional message.
   - Submitting creates a **vendor request** and notifies every platform admin,
     both in-app and by email.
   - The vendor sees: "Thanks, we'll be in touch." No account is created.
2. **Admin reviews.** The Admin › Vendors tab gets a **Requests** view listing
   new requests. Each request can be:
   - turned into a vendor ("Create vendor", which pre-fills the create form), or
   - dismissed.
3. **Create vendor.** The tab also gets a **"Create vendor"** button for
   contacts made offline. The form takes:
   - Brand: name (required), logo, business email, phone, address, website,
     about.
   - Owner: email (required), first name, last name, phone (required, because
     `User.phonenumber` is required and unique).

   Saving does three things:
   - creates the Vendor with status **approved**;
   - creates the owner user with role `vendor_admin`, linked to the vendor, with
     no usable password;
   - emails the owner an invite with a set-password link.

   If the request came from the Requests view, it is marked as converted and
   linked to the new vendor.
4. **First login.** The invite link opens **`/set-password?uid=…&token=…`**.
   - The vendor chooses a password, is signed in (or sent to login, the
     builder's choice), and lands on `/vendor`.
   - The dashboard shows their brand name and logo and an "Add your first
     product" prompt when they have no products.
5. **Selling.** The vendor adds products with the shared product form. The
   vendor's version leaves out the featured checkbox and the vendor selector.
   Products are live as soon as they are saved (status `active` is already the
   default).
6. **Shoppers** see "Sold by <Brand>" on the product page for vendor products,
   and "GrottoMore" for products without a vendor.
7. **Existing products.** The admin product form gets a **Vendor** dropdown
   (default "GrottoMore (no vendor)"). The admin assigns existing products to a
   vendor from there, one product at a time.

## Backend changes

1. **Vendor requests** are a new model in the vendors app.
   - Fields: business name, contact name, email, phone, what they sell,
     message, status (`new`, `converted`, `dismissed`), an optional link to the
     created vendor, and timestamps.
   - **Public create endpoint.** Allows anyone, and is rate-limited with a DRF
     throttle (scope and rate are the builder's choice; aim for a few per hour
     per IP). On create it notifies the platform admins: an in-app
     notification plus an email, following `notify_admins_vendor_signup`, with
     a new notification type.
   - **Admin endpoints** (admin/manager): list (filter by status), and
     dismiss.
2. **Admin create vendor.** This is an admin/manager-only endpoint that
   performs step 3 of the flow atomically.
   - It rejects an owner email or phone that already belongs to a user, and a
     vendor name that already exists, with field errors the form can show.
   - It optionally takes a request id and marks that request converted.
3. **Resend invite.** This is an admin/manager endpoint for a vendor. It
   emails the owner a fresh set-password link and is used when an invite
   expires (Django's default token lifetime is 3 days) or gets lost.
4. **Set-password links.**
   - Add a `FRONTEND_URL` setting (env, default `http://localhost:5173`).
     Production sets `https://grottomore.com`.
   - Build both the invite link and the existing password-reset link as
     `{FRONTEND_URL}/set-password?uid=…&token=…`, which fixes the hardcoded
     localhost link.
   - `password-reset-confirm/` must run `validate_password`.
   - The invite email and the reset email differ only in wording.
5. **Retire vendor self-signup.** Remove the public `vendors/signup/` endpoint,
   because it hands out vendor logins without an admin. Existing vendor
   accounts are unaffected.
6. **Product vendor field.**
   - `ProductCreateSerializer` accepts `vendor` (a vendor id or null) **only
     for admin/manager**.
   - For a `vendor_admin`, `vendor` is always their own vendor and
     `is_featured` is ignored (kept false on create, left unchanged on update).
   - `ProductReadSerializer` exposes `vendor` as `{id, name, slug}` or null.
7. **Shopper visibility.** For anyone who isn't admin/manager/staff, and isn't
   the owning vendor, product list and detail show only products that meet all
   of these conditions:
   - not deleted;
   - status not `draft` or `archived`;
   - vendor is null or approved.

   This is my call, not something the owner asked for. Without it, suspending
   a vendor doesn't take their products down, and a vendor who saves a draft
   publishes it anyway.
8. **Tests.** Add pytest tests for each item above, following the existing
   fixture-based style. The permission boundaries in the anti-goals need
   explicit tests.

## Frontend changes

1. **`/sell` page.** A public form posting to the request endpoint, in the
   current site style. The register page's "I'm a vendor" choice and the footer
   link point to it. `VendorRegisterForm` and its signup hook are removed. The
   buyer path of the register page stays as it is.
2. **Admin › Vendors.**
   - A Requests view (list, "Create vendor", dismiss).
   - A "Create vendor" dialog with the fields above.
   - A "Resend invite" action on each vendor.
3. **`/set-password` page.** Reads `uid` and `token`, takes the new password
   with a confirm field, shows the API's validation errors, and handles an
   expired link with a clear message ("ask GrottoMore to resend your invite").
   - The same page serves password reset. A small **"Forgot password?"** link
     on login asks for an email and calls the existing `password-reset/`.
   - This is my call. Without it, a vendor who forgets their password has no
     way back in.
4. **Vendor dashboard.**
   - Guard `/vendor` to `vendor_admin` users.
   - Show the brand name and logo.
   - Show an empty-state "Add your first product".
   - Hide the bulk-upload tab for vendors.
   - In `ProductManager`, hide `is_featured` for vendors, and show the
     **Vendor** dropdown for admins only.
5. **"Sold by".** `retailerName()` returns `product.vendor.name` when there is
   one, otherwise "GrottoMore". External products keep showing their source
   platform. Product cards stay unchanged.
6. **Types.** Add `vendor` to the product types.
7. **Tests.** Extend the existing frontend tests (Node test runner) only where
   there is logic, such as `retailerName()`.

## Constraints

- Don't commit secrets. Production env changes (adding `FRONTEND_URL`) go into
  the `PROD_ENV_FILE` GitHub secret **before** the backend merge, because each
  deploy rewrites the server `.env` from it.
- Backend first, then frontend. The frontend depends on the new endpoints and
  the product `vendor` field.
- Merging the backend to `master` auto-deploys to EC2. Merging the frontend to
  `master` auto-deploys on Vercel.
- Migrations must apply cleanly on production Postgres. Existing products keep
  `vendor=null`.

## Settled details

These are calls made while writing this document. The owner can override any
of them.

- **Repos.**
  - The frontend is GitHub `Slightly-Techie/discount-ecommerce-frontend`. It is
    checked out locally as `grottomore-frontend`; `grottomore-frontend-*` are
    worktrees of the same repo.
  - The backend is `Slightly-Techie/discount-ecommerce-api`.
- **Production data (checked 2026-10-17).**
  - There are 0 products and 2 vendors: "Burger" (pending) and "Girlies
    accessories and more" (approved), each with one owner and no products.
  - The visibility rule therefore hides nothing today, and no data migration is
    needed.
  - Pending vendors stay pending. The admin approves them with the existing
    Approve button.
- **Set-password link encoding.** The link encodes `uid` with
  `urlsafe_base64_encode`, the Django standard, and confirm decodes it. No
  frontend uses the old raw-pk contract yet, so changing it now costs nothing.
  The token is Django's `default_token_generator`: it dies once the password is
  set, and after `PASSWORD_RESET_TIMEOUT`.
- **Non-approved vendors.**
  - Owners of pending, suspended or rejected vendors can still log in.
  - The dashboard keeps its existing status banners. Product editing stays
    blocked by `IsApprovedVendorAdmin`, and their products are hidden from
    shoppers.
- **Owner email that already has an account.** The create form rejects it with
  "This email already has an account; use another email for the vendor login".
  Promoting a buyer account to vendor is out of scope.
- **Sending the invite.** The vendor and user are created in one transaction.
  The invite is sent after commit.
  - If sending fails, the vendor still exists. The API response says the
    invite wasn't sent, and the admin UI shows a warning pointing to "Resend
    invite".
  - The same applies to the admin notification for a new request: a failed
    email never fails the request.
- **Request form limits.** Use the throttle plus field length limits. There is
  no CAPTCHA and no duplicate check, since admins can dismiss duplicates.
- **Email verification.** A successful set-password marks the user's email as
  verified, because the link proves they own the address.
- **The old reset link.** Nothing depends on the old
  `localhost:8000/reset-password-confirm/` link format: there is no mobile app
  and no frontend route for it.

## Left to the builder

- Endpoint URLs and serializer names.
- Throttle rates.
- Whether set-password signs the vendor in directly.
- Exact copy and layout, within the current design.
- How the Requests view sits inside the Vendors tab: a sub-tab or a filter.
