# GrottoMore UI refresh — Claude Design prompt

Paste everything below the line into Claude Design.

---

Design a refreshed, mobile-first UI for **GrottoMore** (grottomore.com), a discount marketplace in Ghana. It aggregates discounted products from retailers such as Shoprite and Melcom, and vendors can list their own deals. Shoppers browse deals, save favourites, add to cart and place orders.

## Who it's for

- Shoppers in Ghana. About 70% use Android phones, often low-end and on paid mobile data; about 30% use iPhones. Design at **390px wide first**, then a **1280px desktop** layout.
- Mobile data is expensive (1GB is close to a day's minimum wage), so the design should be light: no autoplay video, no decorative full-bleed imagery, no heavy blur or glass effects.
- Currency is Ghana cedis: always write prices as **GH₵ 45.00**, never "$".

## The job of the design

Make good deals **easy to find, easy to trust, and easy to compare** on a phone. A shopper should see at a glance: what it costs now, what it cost before, how much they save, which retailer it's from, and whether the deal ends soon.

## Brand (keep, modernise)

Keep the GrottoMore logo and the teal + orange family, but turn it into a proper, accessible design system. The current colours fail contrast, so use these verified anchors:

- **Brand teal (bright)** `#1CCABE`: only for large fills, illustration and highlights. On white it is 2.05:1, so never use it for text or thin icons.
- **Deep teal** `#117E76` (4.94:1 on white): text links, primary buttons with white text, focus rings, active states.
- **Deal orange** `#F97015`: savings badges and the main call-to-action fill, with **dark text `#111111`** on it (6.6:1), not white.
- **Orange as text** `#C75305` (4.5:1) when orange text is needed on white.
- A **savings green** for "Save GH₵12", dark enough to pass 4.5:1 on white.
- Neutral, mostly white and very light grey surfaces, so product photos carry the colour. Retire the large teal→orange gradients; at most a small accent.

Typography: one variable font or a system font stack, a clear type scale, bold prices with tabular numerals, inputs at 16px minimum. Corner radius: one restrained scale (8–12px cards, pill-shaped chips). Motion: 150–250ms state feedback only, respecting reduced-motion.

## Screens to design (shopper side)

1. **Home**
   - A prominent search bar at the top; not just an icon.
   - A row of category shortcuts.
   - A row of retailer chips (Shoprite, Melcom, and others) that open a filtered listing.
   - Rails for "Biggest savings", "Ending soon" and "Featured", each ending in "See all".
   - At most one static promo strip. **No auto-rotating carousel.**
   - Footer with trust info: WhatsApp/phone support, returns policy, about.
2. **Product listing / search results**
   - 2-column card grid on mobile, 4–5 columns on desktop.
   - A sticky "Filter & Sort" button that opens a full-screen sheet on mobile. The sheet has an explicit "Show 42 results" button and multi-select filters for retailer, category and price range; price range uses typed inputs, not only a slider.
   - Applied filters appear as removable chips above the grid.
   - Sort options: Biggest saving (default), Ending soon, Newest, Price low–high, Price high–low.
   - A "Load more" button rather than infinite scroll.
   - Loading skeletons and a helpful empty state: echo the search, offer "Clear filters", suggest categories.
3. **Product detail** (new page)
   - Image.
   - Price block: now, was, save GH₵ and %.
   - Retailer, plus "Ends in 3 days" only if a real end date exists.
   - Stock state, description, category and tags.
   - Quantity and Add to cart.
   - A delivery fee note, shown before checkout.
   - Related deals.
4. **Cart**
   - Line items with quantity steppers and a remove action.
   - Savings shown per item and in total.
   - Coupon code field.
   - Order summary: subtotal, delivery fee, discount, total.
   - Delivery address shown or added inline; checkout currently requires an address.
   - Empty-cart state.
5. **Checkout & payment**
   - Order summary, delivery address, and a payment method step that lists MTN MoMo, Telecel Cash, AirtelTigo Money (with network logos), pay on delivery, and card last.
   - A "Check your phone and approve GH₵X" waiting state with resend, timeout and failure states.
   - An order confirmation screen that clearly says the order went through.
   - Note: real payment is not wired up yet, so treat this as the target design.
6. **Orders list and order detail**
   - Order number, date, status and total.
   - Detail page with a status stepper (Placed → Confirmed → Out for delivery → Delivered), expected delivery, items, and how to get help.
7. **Favourites / wishlist**: same cards as the listing, plus a remove action and an empty state.
8. **Login & register**
   - Short forms with clear errors and show/hide password.
   - Should work well with password managers and OTP autofill.
   - Explain why to sign in at the moment it's needed, e.g. at checkout. Browsing, favourites and cart work signed-out.
9. **Profile**: personal details, delivery addresses, sign out.
10. **Global navigation**
    - Mobile: a top bar with logo and search, plus a **bottom tab bar** (Home, Categories, Saved, Cart with item count, Account).
    - Desktop: a header with search, category menu, Saved, Cart and Account.
11. **404 page** with search and a way back to deals.

## The deal card (most important component)

The card shows, top to bottom:

- A square 1:1 image on a neutral background.
- A savings badge on the image corner ("-35%").
- The current price, large and bold, in GH₵.
- The original price, struck through and muted (but still passing contrast).
- "Save GH₵12".
- A product title of up to 2 lines.
- The retailer name or logo.
- An optional "Ends Sun" label, only when there's a real end date.
- An optional "Low stock" or "Out of stock" label.
- A heart/save button with a 48px tap area.
- Keep "Add to cart" compact: an icon button, or on the detail page, not a full-width button on every card.

Design its states: default, out of stock, no discount (plain price only), no image, and the loading skeleton.

## Real data the design must fit

Each product has: name, description, price, discount_price (optional), discount_start/discount_end (optional dates), image_url, category, brand/retailer, tags, stock, rating (optional), is_featured. Product photos come from different retailers in different shapes and quality, so the card must look tidy regardless. Names can be long, so design for truncation.

## Honesty rules (non-negotiable)

- No fake countdown timers.
- No fake "N people viewing" or "Only 2 left" unless it comes from real stock.
- No spin-to-win or pop-up gamification.
- Urgency only from real discount_end dates and real stock.

## Accessibility (WCAG 2.2 AA)

- Text contrast at least 4.5:1, and 3:1 for UI components and large text.
- Touch targets 48×48px.
- A visible focus state that sticky headers and bottom bars never cover.
- Labels on all form fields, not placeholder-only.
- No information conveyed by colour alone; savings also get a "-%"/"Save" label.

## Deliverables I need back

1. **Design tokens**, in names I can map to CSS variables:
   - colours, including light and dark variants if you propose dark mode (optional, low priority);
   - type scale, spacing scale, radius, shadows, motion durations.
2. **Component sheet**: buttons (primary, secondary, ghost, destructive; with sizes and states), inputs, select, checkbox, chips, badges (savings, stock, status), deal card with all states, quantity stepper, bottom sheet, tabs, toast, skeletons, empty states, the order status stepper, and the header and bottom tab bar.
3. **Every screen above** at 390px and 1280px, including loading, empty and error states.
4. A short note on layout grid, breakpoints and any interaction details that aren't obvious from the static screens.

Implementation constraints, so the design can be built faithfully:
- It will be built in React with Tailwind CSS and shadcn/ui (Radix primitives) and lucide icons.
- Prefer patterns those support; don't rely on custom illustration sets or special effects that need extra libraries.
