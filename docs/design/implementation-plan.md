# UI refresh: implementation plan

Source: the Claude Design handoff in `~/Downloads/grottomore-design`, which contains `HANDOFF.md`, `tokens.css` and `screens/*.dc.html`. The brief that produced it is [claude-design-prompt.md](claude-design-prompt.md).
Scope: the shopper side. The vendor and admin dashboards only pick up the new tokens; they get no layout changes.

## Ground rules

- Stay on the current stack: Vite, React Router, Tailwind, shadcn/ui and lucide. Add no new dependencies.
- The handoff names Next.js paths. Map them onto `src/pages` and keep the existing URLs so links don't break:

  | Handoff path | Our route | Status |
  |---|---|---|
  | `app/page` | `/` | existing |
  | `deals` | `/products` | existing |
  | `deals/[slug]` | **`/products/:id`** | new, uses the existing `getProduct` |
  | `cart` | `/cart` | existing |
  | `checkout` | **`/checkout`** | new |
  | `saved` | `/favorites` | existing |
  | `account/orders` | `/orders` and `/orders/:id` | existing |
  | `account` | `/profile` | existing |
  | auth | `/login` and `/register` | existing |
  | 404 | `*` | existing |

- Work happens on the branch `feat/ui-refresh`, with one commit per phase. It ships as a PR. **Nothing is deployed without your go-ahead.**

## Decisions where the design is ahead of the backend (defaults; say if you want otherwise)

1. **Payment.** The backend has no payment provider today; the current checkout shows a fake "Payment successful". The checkout page will be built to the design: summary, address, and a payment method list. The only selectable method will be **Pay on delivery**. MoMo, Telecel Cash and AirtelTigo appear as "Coming soon". The MoMo waiting, timed-out and failed screens are deferred until a provider is integrated, because building them now would mean faking a payment.
2. **Sign-in.** The backend supports email and password only. The design's SMS-code screen is left out. Login and register get the new design, with correct `autocomplete` attributes and a "why sign in" banner when the user is redirected from checkout.
3. **Price-range filter.** Whether the API honours `min_price`/`max_price` can't be confirmed: it accepts unknown parameters silently, and the database has 0 products. The filter will be built but hidden until it has been confirmed against the backend. The sort, retailer, category and search filters are wired to parameters the frontend already sends.
4. **Delivery fee.** Shipping is calculated server-side at checkout. The product page and cart will say "Delivery fee calculated at checkout" instead of the design's sample GH₵ 25.00, unless an endpoint exposes the fee.
5. **Dark mode.** The tokens include it, but the UI won't expose a toggle in this pass.
6. **Placeholders.** The logo SVG, the network logos, `[support number]` and `[support hours]` need real assets or values from you. Until then, the current logo stays and the support line is omitted rather than shipped with placeholders.

## Phases

1. **Tokens and theme.**
   - Convert `tokens.css` (hex) into HSL channel variables in `src/index.css`, so the existing `hsl(var(--x))` Tailwind setup and opacity modifiers keep working.
   - Add `brand`, `deal`, `save`, `subtle-foreground` and the radius, shadow and motion tokens to `tailwind.config.ts`.
   - Retire the teal→orange gradients.
   - Add `scroll-padding` and reduced-motion handling.
2. **Shared helpers.** `src/lib/price.ts` with the rules below, plus tests:
   - GH₵ formatting: `GH₵ 1,250.00`, with tabular numerals;
   - numeric (not string) comparison of price and discount price;
   - the discount-validity window;
   - "Ends today" / "Ends Sun" labels, shown only within 7 days;
   - stock labels: out of stock at 0, low stock at 1–5.

   This fixes the current bugs: the `$` sign, the original price never showing, and string comparison.
3. **UI primitives.** Restyle the shadcn components to the component sheet: Button (with a new `deal` variant and sizes 40/48/56), Input, Badge, chips, QuantityStepper, Tabs, Toast placement, Sheet, Skeleton, empty state, and the order stepper.
4. **Deal card and navigation.**
   - DealCard in all of its states.
   - The mobile top bar with sticky search.
   - The bottom tab bar, with a cart count.
   - The desktop header with a category row.
   - The layout shell.
5. **Pages, in the handoff's order:**
   - Home
   - Listing: filter sheet or sidebar, applied chips, sort, "Load more" with the page number in the URL, plus loading, empty and error states
   - Product detail (new)
   - Cart
   - Checkout (new, per decision 1)
   - Orders and order detail
   - Saved
   - Login and register
   - 404
6. **Verification and PR.**
   - Run `npm run build` and `npm run lint`, plus the price-helper tests.
   - Check visually in the browser at 390px and 1280px against the artboards. This uses a local, uncommitted stub API serving the design's sample products, because production has none.
   - Check that the vendor and admin pages still render with the new tokens.
   - Open the PR for your review.

## What is not changing

The API layer, auth/token handling, cart and favourites stores, admin and vendor layouts, and backend behaviour.
