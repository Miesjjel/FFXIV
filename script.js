/*
 * FFXIV Story & Trailer Tracker recovery loader.
 *
 * Version history:
 *   v1.2.1 - Keep loading the historical tracker until its standalone replacement
 *            has been ported and tested. Enhancement code owns group-state persistence.
 *
 * The known-good historical implementation remains the source for quest data,
 * checkbox IDs, trailer functionality, and ffxiv-story-tracker-v2 progress format.
 * Do not remove the loader before a complete local port has been verified.
 */
(async function restoreKnownGoodTracker() {
  const sourceUrl = 'https://raw.githubusercontent.com/Miesjjel/FFXIV/909ab3014ef0949be13198e88947a832b5da5a6f/script.js';
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Could not load previous tracker script (${response.status}).`);
    const restoredScript = document.createElement('script');
    restoredScript.textContent = await response.text();
    document.body.appendChild(restoredScript);
  } catch (error) {
    console.error('FFXIV tracker recovery failed:', error);
    const message = document.createElement('p');
    message.textContent = 'The tracker could not load its restored version. Please check your internet connection and reload.';
    message.setAttribute('role', 'alert');
    document.body.appendChild(message);
  }
})();
