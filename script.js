/*
 * FFXIV Story & Trailer Tracker
 *
 * Purpose:
 *   This app tracks the chronological main-story flow of Final Fantasy XIV,
 *   keeps track of completed MSQ chapters, and reminds the player which
 *   cinematics or trailers still need to be watched.
 *
 * What it does:
 *   - tracks the expanded MSQ questbook by chapter and patch
 *   - shows trailer links per expansion or patch group
 *   - stores progress in localStorage so it persists between reloads
 *
 * Versioning strategy:
 *   - Start at v1.0.0 and increment the patch number with each meaningful update.
 *   - Example format: v1.0.0 -> v1.0.1 -> v1.0.2
 *   - This makes it easy to see what changed and keep the tracker history clear.
 *
 * Version history:
 *   v1.0.0 - Initial tracker release.
 *   v1.0.1 - Added expanded trailer checkboxes and group completion tracking.
 *   v1.0.2 - Persisted selected view state and smoothed expanded-group behaviour.
 *   v1.0.3 - Recalculated the next step from the expanded questbook.
 *   v1.0.4 - Locked the tracker to the expanded questbook as the single source of truth.
 *   v1.0.5 - Showed completed and total quests for each expanded group.
 *   v1.0.6 - Added complete MSQ coverage through Dawntrail patch 7.56 and group completion controls.
 *   v1.0.7 - Excluded optional trailer checkboxes from overall quest progress.
 *   v1.0.8 - Persisted each expanded group's open/closed state per browser so manual folding survives reloads.
 */
    const STORAGE_KEY = 'ffxiv-story-tracker-v2';
    const VERSION_HISTORY = [
      { version: 'v1.0.0', notes: 'Initial tracker release with scripted structure, comments, and release versioning.' },
      { version: 'v1.0.1', notes: 'Added expanded trailer-watched checkboxes and group completion tracking.' },
      { version: 'v1.0.2', notes: 'Persisted selected view mode, removed unnecessary filter buttons, and smoothed expanded group auto-collapse behaviour.' },
      { version: 'v1.0.3', notes: 'Recalculated the next recommended step strictly from the expanded questbook.' },
      { version: 'v1.0.4', notes: 'Locked the tracker to the expanded questbook as the single source of truth.' },
      { version: 'v1.0.5', notes: 'Showed completed and total quests for each expanded group.' },
      { version: 'v1.0.6', notes: 'Added complete MSQ coverage through Dawntrail patch 7.56 and group completion controls.' },
      { version: 'v1.0.7', notes: 'Excluded optional trailer checkboxes from overall quest progress.' },
      { version: 'v1.0.8', notes: 'Persisted each expanded group open/closed state so manual folding survives reloads.' }
    ];
    const APP_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1].version;
    let allChecks = [];
    let storyChecks = [];
    let currentMode = 'expanded';
    const trailerButtons = Array.from(document.querySelectorAll('.trailer-btn'));
    const cinematicRows = Array.from(document.querySelectorAll('.cinematic-row'));
    const expandedView = document.getElementById('expandedView');
    const progressFill = document.getElementById('progressFill');
    const completionText = document.getElementById('completionText');
    const appVersion = document.getElementById('appVersion');
    const nextStepEl = document.getElementById('nextStep');
