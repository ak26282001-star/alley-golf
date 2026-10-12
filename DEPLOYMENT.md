# Alley Golf: deployment readiness

A static site (HTML, CSS and vanilla JS, no build step) that runs on any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
Everything the venue is expected to change lives in **`assets/js/config.js`**.

## Status

| Area | State |
|---|---|
| Layout (375 / 768 / 1280 / 1440 px), no sideways scroll | Tested |
| Navigation (mobile menu, Esc, outside tap, active section) | Tested |
| Course tabs (click + arrow keys), hole cards | Tested |
| Warm-up putting game (drag + keyboard) | Tested |
| Booking: opening-hours tee times, closed days, past slots hidden, player stepper, live ticket total | Tested |
| Booking: validation, loading, success, server error, timeout, unconfigured endpoint | Tested against a local mock backend |
| Reduced-motion support | Tested |
| **Real booking backend** | **Not configured, so bookings can't be sent yet** |

## Required before launch

### 1. Booking backend (blocking)
`config.js → booking.endpoint` is empty. Until it's set, the form **does not pretend to book**. It shows "Online booking isn't available right now" plus the venue phone/email (if filled in).

Point it at any HTTPS endpoint that accepts a JSON `POST` and returns 2xx on success:
- **Formspree / Getform / Basin**: emails each request to the venue (`_subject` and `_replyto` are included).
- **A serverless function** that writes to your booking system, a spreadsheet or a CRM.
- **A booking platform** (e.g. a table/activity booking system with a webhook or API). If you'd rather use their hosted widget, replace the form with their embed.

Notes:
- This is a **booking request**, not a confirmed reservation. The site doesn't know availability or capacity. If tee times must be capacity-checked in real time, the backend has to do that (and respond with an error when a slot is full).
- Allow CORS from your domain if the endpoint is on another origin.
- Don't put secret keys in `config.js` (it's public). Use a serverless function in between.
- Add server-side spam protection (provider spam filter, Turnstile/reCAPTCHA, rate limiting). The page has a hidden honeypot field (`company`).

Payload:
```json
{
  "_subject": "Booking request: Both courses, 2026-10-17 19:30, 4 players",
  "course": "both", "courseName": "Both courses",
  "date": "2026-10-17", "time": "19:30", "players": 4,
  "total": 80, "currency": "GBP",
  "name": "…", "email": "…", "_replyto": "…", "phone": "…", "notes": "…",
  "page": "…", "submittedAt": "ISO-8601"
}
```
After configuring it, send one real test booking and confirm it arrives.

### 2. Opening hours, prices, booking rules (placeholders)
- `hours`: **placeholder** times (closed Mondays, late Fri/Sat). These drive the tee-time picker and the hours shown on the page.
- `prices`: **placeholder** per-player prices (12 / 12 / 20). Set to `0` to show "Pay on arrival" instead of a total.
- `booking.maxPlayers`, `slotMinutes`, `lastTeeBeforeClose`, `daysAhead`, `currency`: confirm them.
- Bank holidays and one-off closures aren't modelled. Add them in the backend or extend `slotsFor()` in `main.js`.

### 3. Venue details
`config.js → venue` (`address`, `email`, `phone`, `instagram`, `mapUrl`) is empty, so nothing is shown. Also add `address`, `telephone`, `url` and `openingHoursSpecification` to the JSON-LD block in `index.html`.

### 4. Content to replace
All copy was written for the design and **must be checked against the real venue**:
- Course names, descriptions, hole names/pars and round times (`COURSES` in `main.js`). The hole maps are generated illustrations, not real layouts.
- The headline claim "Eighteen holes" (two nine-hole courses) and "Putters provided" / "Last orders…" in the ticker.
- The food & drink menu (`#bar` section): dish and cocktail names are examples.
- Group/event offers (`#groups`).

### 5. Photography
The hero alley is a vector illustration, so the site works without photos. For launch, consider:
- A hero photo or short muted loop of the real course at night (≥ 2400 px wide, AVIF/WebP + JPG fallback).
- 4–8 photos of the holes, the bar and groups playing (with permission from anyone recognisable).
- You'll need rights to all images.

### 6. Domain and SEO
- Make `og:image` an absolute URL (`https://YOUR-DOMAIN/assets/img/og-image.jpg`, 1200×630 included) and add a `<link rel="canonical">`.
- Uncomment the `Sitemap:` line in `robots.txt` and add `sitemap.xml`.
- Set up a Google Business Profile (hours, photos, booking link).

### 7. Legal
- Privacy policy page (the booking form collects personal data). Link it under the form and in the footer.
- Booking terms (cancellations, age policy, late arrivals) and alcohol-licensing wording, as applicable.
- A cookie banner if analytics or marketing pixels are added.

## External services the page loads
- **Google Fonts** (Bricolage Grotesque, DM Mono). Self-host them to remove the third-party request.
- Nothing else: no analytics, trackers or frameworks.

## Accessibility
Skip link, landmarks, one `h1`, ARIA tabs with arrow-key support, real radio buttons for the course choice, a labelled stepper, inline errors linked with `aria-describedby`, live status messages, visible focus, 44 px+ touch targets and reduced-motion support. The putting game is playable by keyboard (arrows + Space) and is optional; nothing important depends on it.
Before launch, run an automated axe/Lighthouse audit and a quick screen-reader pass on the final content.

## Local preview
```sh
npx http-server . -p 8080   # then open http://localhost:8080
```
