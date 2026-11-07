/*
 * Recovery loader: execute the last known-good tracker script from commit 909ab301.
 * This keeps the full questbook and tracker logic intact after script.js was
 * accidentally overwritten. Remove this loader once the original file is restored.
 */
(async function restoreKnownGoodTracker() {
  const sourceUrl = 'https://raw.githubusercontent.com/Miesjjel/FFXIV/909ab3014ef0949be13198e88947a832b5da5a6f/script.js';
  const GROUP_STATE_KEY = 'ffxiv-story-tracker-groups-v1';

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Could not load previous tracker script (${response.status}).`);

    const restoredScript = document.createElement('script');
    restoredScript.textContent = await response.text();
    document.body.appendChild(restoredScript);

    // Keep each group's disclosure state separate from quest/trailer checkboxes.
    const groups = Array.from(document.querySelectorAll('#expandedView .expanded-group'));
    let savedGroups = {};
    try {
      const raw = localStorage.getItem(GROUP_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) savedGroups = parsed;
      }
    } catch (error) {
      console.warn('Failed to parse saved group display state:', error);
    }

    // Restore after the app has rendered and restored its completion checkboxes.
    groups.forEach((group) => {
      const name = group.dataset.groupName;
      if (name && typeof savedGroups[name] === 'boolean') group.open = savedGroups[name];
    });

    const saveGroupStates = () => {
      const state = Object.fromEntries(
        groups
          .filter((group) => group.dataset.groupName)
          .map((group) => [group.dataset.groupName, group.open])
      );
      try {
        localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save group display state:', error);
      }
    };

    // The native toggle event fires after the details element's open state changes.
    groups.forEach((group) => group.addEventListener('toggle', saveGroupStates));
  } catch (error) {
    console.error('FFXIV tracker recovery failed:', error);
    const message = document.createElement('p');
    message.textContent = 'The tracker could not load its restored version. Please check your internet connection and reload.';
    message.setAttribute('role', 'alert');
    document.body.appendChild(message);
  }
})();
