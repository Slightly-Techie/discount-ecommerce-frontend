# Vendor Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Businesses ask to sell through a public form. An admin creates the
vendor and its login, and the owner gets an emailed set-password invite.
Vendors then publish products under their own brand, and those products go
live immediately.

**Architecture:**
- The backend (Django/DRF, repo `Slightly-Techie/discount-ecommerce-api`) does
  four things:
  - adds a `VendorRequest` model and endpoints;
  - adds admin create-vendor and resend-invite endpoints;
  - builds set-password links from `FRONTEND_URL`;
  - adds a product `vendor` field and shopper-visibility rules.
- The frontend (Vite/React/TS, repo `Slightly-Techie/discount-ecommerce-frontend`)
  adds `/sell` and `/set-password` pages, admin vendor creation and requests,
  vendor-only product form behaviour, and "Sold by <Brand>".
- Backend ships first. The frontend depends on its endpoints and fields.

**Tech Stack:**
- Backend: Django 5, DRF, simplejwt, django-filter, pytest + pytest-django +
  pytest-factoryboy.
- Frontend: React 18, TypeScript, TanStack Query v5, React Router, Tailwind,
  shadcn/ui, and the Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-17-vendor-onboarding-design.md` (this
repo, branch `docs/vendor-onboarding-spec`).

## Global Constraints

- **Buyer signup is unchanged.**
  - `/register` still shows "I'm shopping" with `RegisterForm`.
  - `POST /api/users/register/` still always creates a `customer`
    (`role` is read-only since PR #11).
- **No one gets a vendor login without an admin creating it.** Remove
  `POST /api/vendors/signup/`. Existing vendor accounts keep working.
- **A vendor never touches another vendor's products, never chooses a
  product's vendor, and never sets `is_featured`.**
- **"Platform staff"** means `role in ("admin", "manager")`, or `is_staff`, or
  `is_superuser`. This matches `IsAdminOrManager`. The production admins have
  `role="customer"` with `is_staff`/`is_superuser`, so never test the role
  alone.
- **Set-password links** are built as
  `{FRONTEND_URL}/set-password?uid=<urlsafe_base64(pk)>&token=<default_token_generator token>`.
  - `FRONTEND_URL` comes from env, default `http://localhost:5173`.
  - Production uses `https://grottomore.com`.
- **Email** is plain text through `django.core.mail.send_mail` or
  `api.common.utils.send_email`.
  - A failed email never fails the request.
  - The create-vendor and resend-invite responses report `invite_sent`.
- **Don't commit secrets.** Before the backend merge, add `FRONTEND_URL` to
  the `PROD_ENV_FILE` GitHub secret, because each deploy rewrites the server
  `.env` from that secret.
- **Backend tests:**
  - Run with `pytest -q -p no:cacheprovider` (CI runs `--create-db` on SQLite).
  - Use pytest-factoryboy fixtures (`user_factory`, `vendor_factory`,
    `product_factory`, `api_client`); don't import factories in tests.
  - `makemigrations --check` must be clean.
- **Frontend tests:**
  - `npm test` (Node runner, `tests/*.test.ts`) must pass.
  - `npx tsc --noEmit -p tsconfig.app.json` must show no errors beyond the 3
    existing ones (BulkUploadCategories, useUsers, productsStore).
  - `npm run build` must succeed.
- **Frontend error messages:** show API errors with `apiErrorMessage(err,
  fallback)` from `@/lib/apiErrors`.
- **Workflow:**
  - One branch per repo: `feat/vendor-onboarding`.
  - PR to `master`, CI green, then merge (merge autonomy is granted).
  - Merging deploys: backend to EC2, frontend to Vercel.

## Review Focus

1. **A vendor_admin browsing the shop.** Today the product list returns only
   their own products, so a vendor who shops sees an empty store.
   - Expected: reads show shopper-visible products plus their own.
   - Writes stay own-only.
   - Pinned by `test_vendor_admin_reads_shop_plus_own_but_writes_own_only`
     (Task 2).
2. **An invite link used twice, or after the password is set.** It must fail
   with "Invalid or expired token." and must not change the password.
   - Pinned by `test_set_password_link_is_single_use` (Task 1).
3. **Creating a vendor when the email send raises (SMTP down).** The vendor and
   user must still exist, and the response must say `invite_sent: false`.
   - Pinned by `test_create_vendor_survives_email_failure` (Task 4).
4. **A vendor PATCH that sends `vendor` or `is_featured`.** Both must be
   silently ignored, not rejected and not applied.
   - Pinned by `test_vendor_admin_cannot_set_vendor_or_featured` (Task 2).
5. **The public request form hammered from one IP.** The 6th request within an
   hour gets 429.
   - Pinned by `test_vendor_request_is_throttled` (Task 3). The cache is
     cleared per test so throttles don't leak.

---

## Backend (repo `discount-ecommerce-api`, branch `feat/vendor-onboarding` from `master`)

### Task 1: Set-password links from FRONTEND_URL

**Files:**
- Create: `api/users/invites.py`
- Modify: `core/settings.py` (add `FRONTEND_URL` next to the email settings).
- Modify: `api/users/views.py`:
  - `PasswordResetRequestView` (≈line 145): build the link with
    `set_password_url`.
  - `PasswordResetConfirmView` (≈line 182): decode the uid, run
    `validate_password`, and mark the email verified.
- Modify: `sample_env` (add a commented `FRONTEND_URL=https://grottomore.com`).
- Test: `api/users/tests/test_password_links.py`

**Interfaces:**
- Produces:
  - `set_password_url(user) -> str` in `api/users/invites.py`.
  - `send_vendor_invite(user, vendor) -> bool` in `api/users/invites.py`. It
    returns True if sent and False if sending raised; it never raises.
  - `POST /api/users/password-reset-confirm/` takes `{uid, token,
    new_password}`, where `uid` is urlsafe base64. It returns 200
    `{"detail": "Password has been reset."}`. On failure it returns 400
    `{"detail": "Invalid or expired token."}` or 400 `{"new_password": [...]}`.

- [ ] **Step 1: Write failing tests** in `api/users/tests/test_password_links.py`
  - `test_set_password_url_uses_frontend_url`: with
    `settings.FRONTEND_URL = "https://grottomore.com"`, the URL starts with
    `"https://grottomore.com/set-password?uid="` and its `uid` decodes
    (`urlsafe_base64_decode`) to `str(user.pk)`.
  - `test_password_reset_email_links_to_frontend`: POST
    `reverse("password-reset")` with the user's email. Then
    `mail.outbox[0].body` contains `"/set-password?uid="` and does not contain
    `"localhost:8000"`.
  - `test_set_password_confirm_sets_password_and_verifies_email`:
    - Setup: a user with `is_email_verified=False` and
      `set_unusable_password()`, with uid and token taken from
      `set_password_url`.
    - Act: POST `{uid, token, new_password: "Vendor-pass-2026"}`.
    - Expect: 200, `user.check_password("Vendor-pass-2026")`, and
      `user.is_email_verified is True`.
  - `test_set_password_confirm_rejects_weak_password`: `new_password: "123"`
    gets 400 with `"new_password"` in the response data.
  - `test_set_password_link_is_single_use`: confirm once (200), then the same
    uid and token with another password get 400
    `{"detail": "Invalid or expired token."}`, and the first password still
    works.
  - `test_set_password_confirm_rejects_garbage_uid`: `uid: "not-base64"` gets
    400 `{"detail": "Invalid or expired token."}`.
  - `test_send_vendor_invite_returns_false_when_mail_fails`: monkeypatch
    `api.users.invites.send_mail` to raise `SMTPException`, and assert the
    result `is False`.
  - Mail tests use `settings.EMAIL_BACKEND =
    "django.core.mail.backends.locmem.EmailBackend"`.
- [ ] **Step 2: Run** `pytest -q api/users/tests/test_password_links.py`.
  Expected: FAIL (ImportError on `api.users.invites`).
- [ ] **Step 3: Implement.**
  - `FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")`.
  - `set_password_url` strips the trailing `/` from `FRONTEND_URL`.
  - `send_vendor_invite` calls `send_mail(..., fail_silently=False)` inside
    `try/except Exception` and returns a bool.
    - Subject: `"You're invited to sell on GrottoMore"`.
    - Body: `f"Hi {first_name or 'there'},\n\nGrottoMore has set up {vendor.name} as a vendor. Choose a password to sign in and add your products:\n\n{url}\n\nThis link expires in 3 days. If it does, ask GrottoMore to resend your invite."`
  - The reset email body: `f"Use this link to reset your password: {set_password_url(user)}"`.
  - Confirm view:
    - Decode with `force_str(urlsafe_base64_decode(uid))`. Any decode or
      lookup error returns the 400 "Invalid or expired token." response.
    - Run `validate_password(new_password, user)`. On `ValidationError`,
      return 400 `{"new_password": list(e.messages)}`.
    - Set the password and `is_email_verified = True`, then save.
- [ ] **Step 4: Run** `pytest -q api/users`. Expected: all pass. Also run the
  full suite to confirm `test_password_reset_request` still passes.
- [ ] **Step 5: Commit** with the message
  `Users: set-password links point at the frontend`.

### Task 2: Product vendor field and shopper visibility

**Files:**
- Modify: `api/common/permissions.py` (add `is_platform_staff`).
- Create: `api/products/visibility.py`
- Modify: `api/products/serializers.py`:
  - `ProductReadSerializer.Meta.fields`: add `"vendor"`.
  - `ProductCreateSerializer`: add a `vendor` field and a `validate` that drops
    staff-only fields.
- Modify: `api/products/views.py`:
  - `ProductListCreateView.get_queryset` and `filterset_fields` (add
    `"vendor"`).
  - `ProductRetrieveView.get_queryset`.
  - `perform_create` sets `is_featured=False` for vendor admins.
- Test: `api/products/tests/test_vendor_products.py`

**Interfaces:**
- Produces:
  - `is_platform_staff(user) -> bool` in `api/common/permissions.py`.
  - `shopper_visible_q() -> Q` in `api/products/visibility.py`. It returns
    `Q(is_deleted=False) & ~Q(status__in=["draft", "archived"]) & (Q(vendor__isnull=True) | Q(vendor__status="approved"))`.
  - The product read payload gains `vendor: {id, name, slug} | null`.
  - `ProductCreateSerializer` accepts `vendor` (a vendor UUID or null) from
    platform staff only.
  - `GET /api/products/?vendor=<uuid>` filters by vendor.

- [ ] **Step 1: Write failing tests**
  - `test_read_payload_includes_vendor`: a product of vendor V gives
    `data["vendor"] == {"id": str(V.id), "name": V.name, "slug": V.slug}`, and
    a product with no vendor gives `None`.
  - `test_staff_can_assign_vendor`: a staff user
    (`user_factory(is_staff=True)`) PATCHes `{"vendor": str(V.id)}` and
    `product.vendor == V`. Then `{"vendor": None}` clears it.
  - `test_vendor_admin_cannot_set_vendor_or_featured`:
    - Setup: an approved vendor A, its owner (`role="vendor_admin"`,
      `vendor=A`), and another vendor B.
    - POST a product with `vendor=B` and `is_featured=True`: 201,
      `vendor == A`, `is_featured is False`.
    - Then PATCH `{"vendor": str(B.id), "is_featured": True, "name": "New"}`:
      200, `name == "New"`, `vendor == A`, `is_featured is False`.
  - `test_shoppers_only_see_visible_products`: an anonymous GET of the list
    returns the ids of products that are active with no vendor, or active with
    an approved vendor. It omits products that are draft, archived, deleted,
    or belong to a suspended or pending vendor. GET detail of a hidden product
    gets 404.
  - `test_vendor_admin_reads_shop_plus_own_but_writes_own_only`:
    - The vendor A owner's list includes A's draft product and another
      vendor's visible product.
    - `?vendor=<A.id>` returns only A's products.
    - PATCH on the other vendor's product gets 404.
  - `test_staff_sees_everything`: a staff list includes the draft and
    suspended-vendor products.
- [ ] **Step 2: Run** `pytest -q api/products/tests/test_vendor_products.py`.
  Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `vendor` is read via a nested read-only serializer with fields `id`,
    `name` and `slug`.
  - Create/update serializer:
    - `vendor = PrimaryKeyRelatedField(queryset=Vendor.objects.all(), required=False, allow_null=True)`.
    - `validate(attrs)` pops `vendor` and `is_featured` unless
      `is_platform_staff(self.context["request"].user)`.
  - Querysets:
    - Platform staff get everything.
    - A `vendor_admin` gets `filter(shopper_visible_q() | Q(vendor=user.vendor))`
      for safe methods, and `filter(vendor=user.vendor)` otherwise.
    - Everyone else gets `filter(shopper_visible_q())`.
  - Replace the existing inline staff checks in these two views with
    `is_platform_staff`.
- [ ] **Step 4: Run** the full suite. Expected: all pass. Existing product
  tests use status `active` and no vendor, so they stay visible.
- [ ] **Step 5: Commit** with the message
  `Products: vendor field, staff-only featured, shopper visibility`.

### Task 3: Vendor requests ("Sell on GrottoMore")

**Files:**
- Modify: `api/vendors/models.py` (add `VendorRequest`).
- Create: migration `api/vendors/migrations/0003_vendorrequest.py` (via
  `makemigrations`).
- Modify: `api/notifications/models.py` (add `Type.VENDOR_REQUEST =
  "vendor_request", "Vendor request"`) plus its migration.
- Modify: `api/notifications/services.py` (add
  `notify_admins_vendor_request`).
- Modify: `api/vendors/serializers.py`, `api/vendors/views.py` and
  `api/vendors/urls.py`.
- Modify: `core/settings.py` (`REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] =
  {"vendor_request": "5/hour"}`).
- Test: `api/vendors/tests/test_requests.py`. It has an autouse fixture that
  calls `django.core.cache.cache.clear()`.

**Interfaces:**
- Produces:
  - `VendorRequest(BaseModel)`:
    - `business_name` (CharField 255)
    - `contact_name` (CharField 255)
    - `email` (EmailField)
    - `phone` (CharField 32)
    - `sells` (TextField, max 1000 enforced in the serializer)
    - `message` (TextField, blank, max 2000)
    - `status` (TextChoices `new`/`converted`/`dismissed`, default `new`)
    - `vendor` (FK Vendor, null, `SET_NULL`, `related_name="requests"`)
    - ordering `-created_at`
  - `POST /api/vendors/requests/` (AllowAny, `ScopedRateThrottle` with
    `throttle_scope = "vendor_request"`) takes `{business_name, contact_name,
    email, phone, sells, message?}`. It returns 201
    `{"detail": "Thanks, we'll be in touch."}`.
  - `GET /api/vendors/requests/` (IsAdminOrManager) is paginated, with
    `?status=` filtering. Items:
    `{id, business_name, contact_name, email, phone, sells, message, status, vendor, created_at}`.
    URL name: `vendors:vendor-request-list`.
  - `PATCH /api/vendors/requests/<uuid>/dismiss/` (IsAdminOrManager) returns
    200 with the item and status `dismissed`. URL name:
    `vendors:vendor-request-dismiss`.
  - `notify_admins_vendor_request(vendor_request) -> None` sends an in-app
    `Notification` of type `vendor_request` to each `get_platform_admins()`
    user. Title: `f"New seller request: {business_name}"`. It also sends an
    email through `send_email` (fail_silently).

- [ ] **Step 1: Write failing tests**
  - `test_anyone_can_submit_vendor_request`:
    - Expect 201, one `VendorRequest` with status `new`, and one
      `vendor_request` notification for a staff user.
    - `mail.outbox` has 1 message to the staff user, using the locmem
      backend.
    - No `User` was created.
  - `test_vendor_request_requires_fields`: a missing `business_name` or
    `email` gets 400 naming the field.
  - `test_vendor_request_is_throttled`: 5 POSTs give 201 and the 6th gives
    429.
  - `test_only_staff_list_requests`:
    - anonymous gets 401;
    - a customer gets 403;
    - staff get 200 with the request;
    - `?status=dismissed` excludes new requests.
  - `test_staff_dismiss_request`: PATCH gives 200 and status `dismissed`.
- [ ] **Step 2: Run** `pytest -q api/vendors/tests/test_requests.py`.
  Expected: FAIL.
- [ ] **Step 3: Implement** the model and migrations
  (`python manage.py makemigrations vendors notifications`), the serializers,
  views, URLs, throttle setting and notify service.
  - Register the `requests/` paths **before** `<uuid:pk>/` in `urls.py`.
- [ ] **Step 4: Run** the full suite and `makemigrations --check --dry-run`.
  Expected: all pass, no changes.
- [ ] **Step 5: Commit** with the message
  `Vendors: public seller requests with admin review`.

### Task 4: Admin creates vendors, resend invite, retire self-signup

**Files:**
- Modify: `api/vendors/serializers.py`:
  - Add `VendorCreateSerializer`.
  - Remove `VendorAdminSignupSerializer` and
    `VendorAdminSignupResponseSerializer`.
- Modify: `api/vendors/views.py`:
  - `VendorListView` becomes `generics.ListCreateAPIView`: POST requires
    `IsAdminOrManager`, GET is unchanged.
  - Add `VendorResendInviteView`.
  - Remove `VendorAdminSignupView`.
- Modify: `api/vendors/urls.py`:
  - Remove `signup/`.
  - Add `<uuid:pk>/resend-invite/`, with name
    `vendors:vendor-resend-invite`.
- Modify: `api/vendors/tests/test_views.py`. Delete the `TestVendorAdminSignup`
  tests and replace them with the tests below.
- Modify: `api/notifications/services.py`. If `notify_admins_vendor_signup` is
  left unused, remove it.

**Interfaces:**
- Consumes:
  - `send_vendor_invite(user, vendor) -> bool` (Task 1).
  - `VendorRequest` (Task 3).
- Produces:
  - `POST /api/vendors/`
    - Accepts JSON or multipart (for `logo`), with fields: `name`*,
      `business_email`, `phone`, `address`, `website`, `about`, `logo`,
      `owner_email`*, `owner_first_name`, `owner_last_name`,
      `owner_phonenumber`*, and `request` (an optional VendorRequest UUID).
    - Returns 201 with `VendorAdminSerializer` data plus
      `"invite_sent": bool`.
    - Returns 400 with field errors for `name` ("Vendor name already exists."),
      `owner_email` ("This email already has an account; use another email for
      the vendor login.") and `owner_phonenumber` ("This phone number already
      has an account.").
  - `POST /api/vendors/<uuid>/resend-invite/` (IsAdminOrManager) returns 200
    `{"invite_sent": bool}`. It returns 400 `{"detail": "This vendor has no
    login to invite."}` when the vendor has no owner.
  - `POST /api/vendors/signup/` returns 404.

- [ ] **Step 1: Write failing tests**
  - `test_staff_create_vendor_creates_login_and_sends_invite`:
    - Expect 201, a vendor with status `approved`, and an owner with
      `role="vendor_admin"`, `vendor=` the new vendor, and
      `has_usable_password() is False`.
    - Expect `invite_sent is True`, and `mail.outbox[0].body` containing
      `"/set-password?uid="`.
  - `test_create_vendor_converts_request`: passing `request=<id>` sets that
    request's status to `converted` and its `vendor` to the new vendor.
  - `test_create_vendor_rejects_existing_email_phone_and_name`: three cases,
    each a 400 with the right field key, and no vendor or user created.
  - `test_create_vendor_survives_email_failure`: monkeypatch
    `api.users.invites.send_mail` to raise. Expect 201,
    `invite_sent is False`, and the vendor and user exist.
  - `test_non_staff_cannot_create_vendor`: anonymous gets 401, and a customer
    and a vendor_admin each get 403.
  - `test_resend_invite`:
    - staff get 200 with `invite_sent: true` and a new email in the outbox;
    - a vendor with no owner gets 400;
    - a customer gets 403.
  - `test_vendor_self_signup_is_gone`: POST `/api/vendors/signup/` gets 404.
  - `test_invited_owner_can_set_password_and_create_product` (end to end):
    - Create a vendor via the API and parse uid and token from the email.
    - POST to `password-reset-confirm`, then log in at `/api/auth/token/`.
    - Create a product with the access token. Expect 201 and `vendor` equal to
      the new vendor.
- [ ] **Step 2: Run** `pytest -q api/vendors`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Create the vendor and the user (`User.objects.create_user(email=...,
    password=None, role="vendor_admin", vendor=vendor, phonenumber=...,
    otp_secret=pyotp.random_base32(), ...)`) inside `transaction.atomic()`.
  - Mark the request converted inside the same transaction.
  - Call `send_vendor_invite` after the atomic block.
  - Uniqueness checks are case-insensitive (`iexact`), matching the existing
    signup serializer.
- [ ] **Step 4: Run** the full suite and `makemigrations --check`.
  Expected: all pass.
- [ ] **Step 5: Commit** with the message
  `Vendors: admins create vendors with emailed invites; remove self-signup`.

### Task 5: Ship the backend

- [ ] **Step 1:** Add `FRONTEND_URL=https://grottomore.com` to the
  `PROD_ENV_FILE` secret.
  - Read the current server `.env` over SSH, excluding the two
    `RUN_*_ON_STARTUP` lines the deploy appends.
  - Append the new line and `gh secret set PROD_ENV_FILE` from a temp file
    with mode 600.
  - Delete the temp file and never print the content.
- [ ] **Step 2:** Push the branch, open a PR, and wait for CI to pass.
- [ ] **Step 3:** Merge and watch the deploy run until "Deploy to production
  EC2: success".
- [ ] **Step 4:** Check against production:
  - `POST https://api.grottomore.com/api/vendors/signup/` returns 404.
  - `GET /api/products/` returns 200.
  - On the server, `sudo docker compose exec -T web python manage.py shell -c
    "from django.conf import settings; print(settings.FRONTEND_URL)"` prints
    `https://grottomore.com`.

---

## Frontend (repo `discount-ecommerce-frontend`, branch `feat/vendor-onboarding` from `master`, in worktree `../grottomore-frontend-vendor-onboarding` with a `node_modules` symlink to the main checkout)

### Task 6: Types, API client, "Sold by", vendor-aware product form

**Files:**
- Modify: `src/types/product.ts`:
  - `Product` gains `vendor?: { id: string; name: string; slug: string } | null`.
  - The create/update payload type gains `vendor?: string | null`.
- Modify: `src/types/api.ts`:
  - The notification type union gains `'vendor_request'`.
  - Add the `VendorRequest` and `CreateVendorPayload` types, matching Tasks 3
    and 4.
- Modify: `src/lib/api.ts` (`vendorsApi`):
  - Remove `signup`.
  - Add `createVendor(data: CreateVendorPayload | FormData)`,
    `resendInvite(id)`, `submitRequest(data)`, `listRequests(params)` and
    `dismissRequest(id)`.
- Modify: `src/lib/api.ts` (`authApi`): add
  `requestPasswordReset(email)` and
  `confirmPasswordReset({uid, token, new_password})`.
- Modify: `src/lib/deal.ts`:
  - `DisplayFields` gains `vendor?: { name: string } | null`.
  - `retailerName` order: a non-empty `source_platform` wins, then
    `vendor.name`, then `"GrottoMore"`. The "Vendor deal" label goes away.
- Modify: `tests/deal.test.ts` (the `retailerName` test).
- Modify: `src/components/ProductManager.tsx`:
  - New prop `mode?: "admin" | "vendor"` (default `"admin"`).
  - In `"vendor"` mode, hide the Featured checkbox and send no `is_featured`.
  - In `"admin"` mode, show a **Vendor** select. It is populated from
    `GET /vendors/` (all statuses; staff get every vendor), with first option
    `"GrottoMore (no vendor)"` (value `""`, sent as `null`). It is prefilled
    from `product.vendor?.id` on edit.
- Modify: `src/components/VendorProductsPanel.tsx`:
  - Pass `mode="vendor"`.
  - Remove the Bulk upload tab and its `Tabs` wrapper, so only the product
    list remains.

**Interfaces:**
- Produces: `vendorsApi.*` and `authApi.*` as above, used by Tasks 7–9.
  `retailerName` now shows the brand everywhere it's used: product page,
  `DealCard` and cart. This is a ruling: the spec said cards were unchanged,
  but cards already call `retailerName`, so they show the brand instead of
  "Vendor deal".

- [ ] **Step 1: Update the test** `retailerName uses source_platform, then vendor name, else GrottoMore`:
  - `{source:'external', source_platform:'Shoprite'}` → `'Shoprite'`
  - `{source:'internal', source_platform:'', vendor:{name:'Girlies'}}` → `'Girlies'`
  - `{source:'internal', vendor:null}` → `'GrottoMore'`
  - `{}` → `'GrottoMore'`
- [ ] **Step 2: Run** `npm test`. Expected: FAIL on that test.
- [ ] **Step 3: Implement** the changes listed above.
- [ ] **Step 4: Run** `npm test`, `npx tsc --noEmit -p tsconfig.app.json`
  (3 baseline errors only) and `npm run build`. Expected: pass.
- [ ] **Step 5: Commit** with the message
  `Vendors: brand in "Sold by", admin vendor picker, vendor-mode product form`.

### Task 7: "Sell on GrottoMore" page replaces vendor self-signup

**Files:**
- Create: `src/pages/Sell.tsx` (route `/sell`).
  - Use `Layout` with
    `mobileBar={{ kind: "title", title: "Sell on GrottoMore" }}`.
  - A native `<form>` with `useState` fields: Business name*, Your name*,
    Email*, Phone*, What do you sell?*, and Anything else (optional).
  - Submit with a TanStack `useMutation` calling `vendorsApi.submitRequest`.
  - On success, replace the form with "Thanks, we'll be in touch." and a link
    back to the shop.
  - On error, show `apiErrorMessage`. A 429 shows "Too many requests, please
    try again later."
- Modify: `src/App.tsx` (add the route).
- Modify: `src/pages/Register.tsx`:
  - The "I'm a vendor" choice navigates to `/sell`.
  - `?as=vendor` redirects to `/sell`.
  - The customer path is unchanged.
- Modify: `src/components/Footer.tsx`: link text "Sell on GrottoMore",
  pointing to `/sell`.
- Delete: `src/components/VendorRegisterForm.tsx` and `useVendorSignup` in
  `src/hooks/useVendors.ts`.
- Add `useSubmitVendorRequest` to `src/hooks/useVendors.ts`.

- [ ] **Step 1: Implement.** There's no new logic to unit-test; the form is
  wiring.
- [ ] **Step 2: Verify.**
  - `npm test`, `tsc` (baseline) and `npm run build` pass.
  - `grep -rn "VendorRegisterForm\|useVendorSignup\|vendors/signup" src`
    returns nothing.
- [ ] **Step 3: Commit** with the message
  `Vendors: Sell on GrottoMore request form replaces self-signup`.

### Task 8: Set-password page and "Forgot password?"

**Files:**
- Create: `src/pages/SetPassword.tsx` (route `/set-password`).
  - Read `uid` and `token` from the query string. If either is missing, show
    "This link is incomplete." with a link to `/login`.
  - Fields: New password and Confirm password. A mismatch is a client-side
    error ("Passwords don't match").
  - Submit via `authApi.confirmPasswordReset`.
  - On 200: navigate to `/login?next=/vendor&reason=password-set`. `Login`
    shows "Password set. Sign in to continue." when `reason=password-set`.
    - After login, a `vendor_admin` reaches `/vendor` through `next`, and a
      customer reset lands back on `/vendor`, whose guard (Task 9) sends
      non-vendors to `/`.
    - Ruling: sign-in is not automatic. The confirm endpoint returns no tokens,
      and adding them widens the backend change.
  - On 400 `{"detail": "Invalid or expired token."}`: show "This link has
    expired or was already used. Ask GrottoMore to resend your invite, or
    request a new reset link." with a link to `/forgot-password`.
  - Other 400s go through `apiErrorMessage`, which covers `new_password`
    validation messages.
- Create: `src/pages/ForgotPassword.tsx` (route `/forgot-password`).
  - An email field that submits via `authApi.requestPasswordReset`.
  - It always shows "If that email has an account, we've sent a reset link."
- Modify: `src/App.tsx` (add both routes).
- Modify: `src/components/LoginForm.tsx`: a "Forgot password?" link to
  `/forgot-password` under the password field.
- Modify: `src/pages/Login.tsx`: the `reason=password-set` notice.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify:** `npm test`, `tsc` (baseline) and `npm run build`
  pass.
- [ ] **Step 3: Commit** with the message
  `Auth: set-password and forgot-password pages`.

### Task 9: Admin vendor creation and requests; vendor dashboard polish

**Files:**
- Modify: `src/components/VendorManager.tsx`:
  - Add a header button "Create vendor" that opens a `CreateVendorDialog`, kept
    in the same file to match how `VendorEditDialog` lives there.
    - Fields: Brand name*, Logo (file), Business email, Phone, Address,
      Website, About, Owner email*, Owner first name, Owner last name, and
      Owner phone*.
    - It sends `FormData` when a logo is chosen, otherwise JSON.
    - Field errors come back from the API.
  - On success: when `invite_sent` is true, toast "Vendor created. Invite sent
    to <owner_email>." When it is false, show a warning toast "Vendor created,
    but the invite email failed. Use Resend invite."
  - Add a "Requests" toggle next to the existing status filter. It switches
    the table to the new requests list (`status=new` by default), with columns
    Business, Contact, Email/Phone, Sells, and Received.
    - Actions: "Create vendor", which opens `CreateVendorDialog` prefilled
      with name, owner email, owner name and phone, and passes `request` id.
    - "Dismiss" asks for confirmation first.
  - Add a "Resend invite" button to each vendor row's actions and to
    `VendorDetailDialog`. It toasts based on the result.
  - Refetch both lists after mutations (`invalidateQueries`).
- Modify: `src/hooks/useVendors.ts`: add `useCreateVendor`,
  `useResendInvite`, `useVendorRequests(params)` and `useDismissVendorRequest`.
- Modify: `src/pages/VendorDashboard.tsx`:
  - Guard: once the user has loaded, a role other than `vendor_admin`
    navigates to `/`.
  - Show the vendor logo (if any) next to the brand name in the sidebar or
    header.
  - The overview shows an "Add your first product" card with a button that
    switches to the products section when the vendor's product count is 0 and
    status is `approved`.
- Modify: `src/lib/roles.ts`: add
  `isVendorAdmin = (user) => !!user && user.role === "vendor_admin"`.
- Modify: `src/components/admin/NotificationBell.tsx`: if it switches on
  notification type, link `vendor_request` to `/admin?tab=vendors`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify:** `npm test`, `tsc` (baseline) and `npm run build`
  pass.
- [ ] **Step 3: Commit** with the message
  `Vendors: admin create vendor, seller requests, resend invite; dashboard guard`.

### Task 10: Ship the frontend and check end to end

- [ ] **Step 1:** Push the branch and open a PR. Wait for the Vercel preview,
  then merge.
- [ ] **Step 2:** Check the production deploy is live: `/sell`,
  `/set-password` and `/forgot-password` load, and the register page still
  shows "I'm shopping" with the buyer form.
- [ ] **Step 3: End-to-end check on production, then clean up.**
  - Submit `/sell` once as `"Test seller (Claude)"`, with `delivered@resend.dev`
    as the email.
  - Via the API as staff, using a short-lived token from a
    `manage.py shell`-issued JWT, create a vendor from that request. Use owner
    email `delivered@resend.dev` and a test phone.
  - Confirm through the Resend API that the invite was delivered.
  - Then delete that test vendor, user and request in `manage.py shell`, and
    confirm the counts are back to the 2 real vendors.
  - Tell the user this was done and cleaned up.

---

## Self-review notes (for the executor)

- **Spec coverage:**
  - flow steps 1–2: Tasks 3, 7 and 9;
  - step 3: Tasks 4 and 9;
  - step 4: Tasks 1 and 8;
  - step 5: Tasks 2 and 6;
  - step 6: Task 6;
  - step 7: Task 6;
  - retire self-signup: Tasks 4 and 7;
  - visibility: Task 2;
  - dashboard guard, empty state and hidden bulk upload: Tasks 6 and 9;
  - `FRONTEND_URL` in prod: Task 5.
- **Rulings made here:**
  - cards show the brand (Task 6);
  - no automatic sign-in after set-password (Task 8);
  - vendor_admin reads are the shop plus their own products (Task 2,
    Review Focus 1);
  - `?vendor=` becomes a real filter (Task 2).
