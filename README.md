# Alley Pond Golf Center

Website for Alley Pond Golf Center, 232-01 Northern Blvd, Douglaston, NY 11362.
Est. 1949 · Reimagined 2026 · Managed by Knox Golf Academy.

- `index.html`: the whole site in one file (styles, SVG artwork and scripts are inline)
  - Opening swing animation, with a static version for visitors who turn off animations
  - "Take a swing" interactive 3D bay with shot data
  - Live 3D companion golfer that follows visitors down the page
  - Slot booking with a putt-in-the-cup confirmation

Static site, no build step: host it on any static host (Netlify, Cloudflare Pages, GitHub Pages).
The 3D features load Three.js r128 from cdnjs; everything else is self-contained.

## Before launch

Edit the `SITE` block at the top of the main script in `index.html`:

- `bookBayUrl`, `bookSimUrl`, `bookLessonUrl`: links to the real booking system. Until they're set, the last booking step asks visitors to call (718) 225-9187. The slot picker does not reserve anything by itself.
- `slotTimes`: the times offered in the slot picker (sample hourly times for now).
- `instagram`, `facebook`: social links for the footer.

Also replace the placeholder **Hours** and **Pricing** sections (search `index.html` for `HOURS:` and `PRICING:`).
