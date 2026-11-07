/*
 * FFXIV Story & Trailer Tracker recovery loader.
 *
 * Version history:
 *   v1.1.0 - Persist each quest group's open/closed state independently from quest and trailer completion.
 *
 * The original tracker logic is loaded from the last known-good script commit.
 * Group display state is restored after that script renders the quest groups.
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

    const groups = Array.from(document.querySelectorAll('#expandedView details.expanded-group'));
    if (!groups.length) throw new Error('The rendered quest groups could not be found.');

    let savedGroups = {};
    try {
      const raw = localStorage.getItem(GROUP_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) savedGroups = parsed;
      }
    } catch (error) {
      console.warn('Could not read saved quest-group display state:', error);
    }

    // Prevent the restoration itself from being mistaken for a user change.
    let restoring = true;
    groups.forEach((group) => {
      const name = group.dataset.groupName;
      if (name && typeof savedGroups[name] === 'boolean') {
        group.open = savedGroups[name];
      }
    });

    const persistGroupStates = () => {
      if (restoring) return;
      const state = Object.fromEntries(
        groups
          .filter((group) => group.dataset.groupName)
          .map((group) => [group.dataset.groupName, group.open])
      );
      try {
        localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Could not save quest-group display state:', error);
      }
    };

    // Observe the actual open attribute: native <details> toggle events can be
    // coalesced with the initial render and overwrite a just-restored state.
    const observer = new MutationObserver(persistGroupStates);
    groups.forEach((group) => observer.observe(group, { attributes: true, attributeFilter: ['open'] }));

    // Let mutation callbacks from the restoration finish before saving changes.
    window.setTimeout(() => {
      restoring = false;
    }, 0);
  } catch (error) {
    console.error('FFXIV tracker recovery failed:', error);
    const message = document.createElement('p');
    message.textContent = 'The tracker could not load its restored version. Please check your internet connection and reload.';
    message.setAttribute('role', 'alert');
    document.body.appendChild(message);
  }
})();
