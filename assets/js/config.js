/*
 * Alley Golf: site configuration.
 * Everything the venue needs to change before launch lives here.
 * See DEPLOYMENT.md for what each value needs to be.
 */
window.AG_CONFIG = {
  booking: {
    // POST endpoint that receives booking requests as JSON (Formspree, a serverless
    // function, your booking system's webhook…). Leave empty and the form will NOT
    // pretend to book: it shows a clear "not available" message with contact details.
    endpoint: "",
    headers: {},          // extra headers if your backend needs them (no secret keys: this file is public)
    timeoutMs: 15000,
    maxPlayers: 8,
    slotMinutes: 30,      // gap between tee times
    lastTeeBeforeClose: 60, // minutes before closing that the last tee time starts
    daysAhead: 60         // how far ahead people can book
  },

  // PLACEHOLDER opening hours, 24h "HH:MM". Day 0 = Sunday. null = closed.
  hours: {
    0: ["12:00", "22:00"],
    1: null,
    2: ["16:00", "23:00"],
    3: ["16:00", "23:00"],
    4: ["16:00", "23:00"],
    5: ["12:00", "00:00"],
    6: ["11:00", "00:00"]
  },

  // PLACEHOLDER prices per player per round, in whole currency units.
  prices: { backalley: 12, fireescape: 12, both: 20 },
  currency: { code: "GBP", locale: "en-GB" },

  // Venue details. Empty values are hidden.
  venue: {
    address: "",
    email: "",
    phone: "",
    instagram: "",
    mapUrl: ""
  }
};
