/*
 * FFXIV Story & Trailer Tracker — local enhancement layer.
 *
 * Version history:
 *   v1.2.0 - Resume navigation, local session note, and combined quest search/filters.
 *   v1.2.1 - Restore group disclosure only after the historical renderer finishes;
 *            centralize group-state persistence here to avoid startup races.
 *
 * Compatibility: legacy checkbox state remains in ffxiv-story-tracker-v2.
 * Group state stays in ffxiv-story-tracker-groups-v1; the note uses its own key.
 */
(() => {
  'use strict';

  const GROUP_STATE_KEY = 'ffxiv-story-tracker-groups-v1';
  const NOTE_STORAGE_KEY = 'ffxiv-story-tracker-note-v1';
  const list = document.getElementById('expandedQuestBook');
  if (!list) return;

  const searchInput = document.getElementById('questSearch');
  const progressFilter = document.getElementById('progressFilter');
  const expansionFilter = document.getElementById('expansionFilter');
  const resultCount = document.getElementById('resultCount');
  const noResults = document.getElementById('noQuestResults');
  const resumeQuest = document.getElementById('resumeQuest');
  const resumeGroup = document.getElementById('resumeGroup');
  const resumeButton = document.getElementById('resumeButton');
  const noteField = document.getElementById('sessionNote');
  const noteMessage = document.getElementById('noteMessage');
  let initialized = false;
  let settleTimer = 0;

  function safeRead(key) {
    try { return localStorage.getItem(key); }
    catch (error) { console.warn(`Local storage read failed for ${key}:`, error); return null; }
  }

  function safeWrite(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { console.warn(`Local storage write failed for ${key}:`, error); return false; }
  }

  function groups() {
    return Array.from(list.querySelectorAll(':scope > .expanded-group'));
  }

  function expansionKey(groupName) {
    const prefix = (groupName || '').split(' · ')[0].trim().toUpperCase();
    const labels = { ARR: 'A Realm Reborn', HW: 'Heavensward', SB: 'Stormblood', SHB: 'Shadowbringers', EW: 'Endwalker', DT: 'Dawntrail' };
    return labels[prefix] || prefix;
  }

  function saveGroupState() {
    const state = Object.fromEntries(groups().filter((group) => group.dataset.groupName)
      .map((group) => [group.dataset.groupName, group.open]));
    safeWrite(GROUP_STATE_KEY, JSON.stringify(state));
  }

  function restoreGroupState(renderedGroups) {
    let saved = {};
    try {
      const raw = safeRead(GROUP_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
    } catch (error) {
      console.warn('Saved quest group state is invalid; retaining defaults.', error);
    }

    // Restore before event handlers are added so startup mutations cannot overwrite saved values.
    renderedGroups.forEach((group) => {
      const name = group.dataset.groupName;
      if (name && typeof saved[name] === 'boolean') group.open = saved[name];
      group.addEventListener('toggle', saveGroupState);
    });
  }

  function questRows() {
    return Array.from(list.querySelectorAll('.expanded-row')).map((row) => ({
      row,
      checkbox: row.querySelector('.expanded-check'),
      group: row.closest('.expanded-group'),
      title: row.querySelector('.task-text')?.textContent.trim() || ''
    })).filter((item) => item.checkbox && item.group);
  }

  function expansionKeyForFilter(groupName) {
    const prefix = (groupName || '').split(' · ')[0].trim().toUpperCase();
    const names = { ARR: 'A Realm Reborn', HW: 'Heavensward', SB: 'Stormblood', SHB: 'Shadowbringers', EW: 'Endwalker', DT: 'Dawntrail' };
    return names[prefix] || prefix;
  }

  function populateExpansionFilter() {
    if (!expansionFilter || expansionFilter.dataset.ready) return;
    [...new Set(groups().map((group) => expansionKeyForFilter(group.dataset.groupName)))].forEach((name) => {
      if (!name) return;
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      expansionFilter.appendChild(option);
    });
    expansionFilter.dataset.ready = 'true';
  }

  function applyQuestFilters() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase();
    const status = progressFilter?.value || 'all';
    const expansion = expansionFilter?.value || 'all';
    let visibleCount = 0;

    groups().forEach((group) => {
      let groupCount = 0;
      const groupExpansion = expansionKeyForFilter(group.dataset.groupName);
      group.querySelectorAll('.expanded-row').forEach((row) => {
        const check = row.querySelector('.expanded-check');
        const title = row.querySelector('.task-text')?.textContent.trim() || '';
        const visible = title.toLocaleLowerCase().includes(query)
          && (status === 'all' || (status === 'completed' ? Boolean(check?.checked) : !check?.checked))
          && (expansion === 'all' || expansion === groupExpansion);
        row.hidden = !visible;
        if (visible) { groupCount += 1; visibleCount += 1; }
      });
      group.hidden = groupCount === 0;
    });

    if (resultCount) resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'quest' : 'quests'} gevonden`;
    if (noResults) noResults.hidden = visibleCount > 0;
  }

  function nextIncomplete() {
    // The historical renderer follows the canonical chronological quest array.
    return questRows().find(({ checkbox }) => !checkbox.checked) || null;
  }

  function updateResume() {
    const next = nextIncomplete();
    if (!next) {
      if (resumeQuest) resumeQuest.textContent = 'Alle quests zijn voltooid. Goed gedaan!';
      if (resumeGroup) resumeGroup.textContent = '';
      if (resumeButton) resumeButton.disabled = true;
      return;
    }
    if (resumeQuest) resumeQuest.textContent = next.title;
    if (resumeGroup) resumeGroup.textContent = next.group.dataset.groupName || '';
    if (resumeButton) resumeButton.disabled = false;
  }

  function goToNextQuest() {
    const next = nextIncomplete();
    if (!next) { updateResume(); return; }
    if (searchInput) searchInput.value = '';
    if (progressFilter) progressFilter.value = 'all';
    if (expansionFilter) expansionFilter.value = 'all';
    applyQuestFilters();
    next.group.hidden = false;
    next.group.open = true;
    next.row.hidden = false;
    next.row.classList.remove('resume-highlight');
    void next.row.offsetWidth;
    next.row.classList.add('resume-highlight');
    next.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => next.row.classList.remove('resume-highlight'), 2400);
  }

  function initializeNote() {
    if (!noteField) return;
    noteField.value = safeRead(NOTE_STORAGE_KEY) || '';
    document.getElementById('saveNote')?.addEventListener('click', () => {
      const saved = safeWrite(NOTE_STORAGE_KEY, noteField.value);
      if (noteMessage) noteMessage.textContent = saved ? 'Notitie opgeslagen.' : 'Opslaan is niet gelukt in deze browser.';
    });
    document.getElementById('clearNote')?.addEventListener('click', () => {
      let cleared = false;
      try { localStorage.removeItem(NOTE_STORAGE_KEY); cleared = true; }
      catch (error) { console.warn('Could not clear the session note:', error); }
      if (cleared) noteField.value = '';
      if (noteMessage) noteMessage.textContent = cleared ? 'Notitie gewist.' : 'Wissen is niet gelukt in deze browser.';
    });
  }

  function initializeWhenStable() {
    if (initialized) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const renderedGroups = groups();
      if (!renderedGroups.length || !renderedGroups.every((group) => group.querySelector('.expanded-check'))) return;
      initialized = true;
      restoreGroupState(renderedGroups);
      populateExpansionFilter();
      applyQuestFilters();
      updateResume();
    }, 100);
  }

  searchInput?.addEventListener('input', applyQuestFilters);
  progressFilter?.addEventListener('change', applyQuestFilters);
  expansionFilter?.addEventListener('change', applyQuestFilters);
  document.getElementById('resetQuestFilters')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (progressFilter) progressFilter.value = 'all';
    if (expansionFilter) expansionFilter.value = 'all';
    applyQuestFilters();
  });
  resumeButton?.addEventListener('click', goToNextQuest);
  list.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.classList.contains('expanded-check')) {
      updateResume();
      applyQuestFilters();
    }
  });

  initializeNote();
  const renderObserver = new MutationObserver(() => {
    if (!initialized) initializeWhenStable();
    else {
      populateExpansionFilter();
      updateResume();
      applyQuestFilters();
    }
  });
  renderObserver.observe(list, { childList: true, subtree: true });
  initializeWhenStable();
})();
