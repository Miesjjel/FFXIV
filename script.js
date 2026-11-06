/*
 * Recovery loader: execute the last known-good tracker script from commit 909ab301.
 * This keeps the full questbook and tracker logic intact after script.js was
 * accidentally overwritten. Remove this loader once the original file is restored.
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
