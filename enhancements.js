/*
 * FFXIV Story & Trailer Tracker — local enhancement layer.
 *
 * Version history:
 *   v1.2.0 - Added resume navigation, a private local session note, and combined quest search/filters.
 *            Keeps legacy quest progress (ffxiv-story-tracker-v2) and group display
 *            state (ffxiv-story-tracker-groups-v1) separate and unchanged.
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
  let groupsReady = false;
  let currentNextId = null;

  function safeRead(key) {
    try { return localStorage.getItem(key); } catch (error) {
      console.warn(`Local storage read failed for ${key}:`, error);
      return null;
    }
  }

  function safeWrite(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) {
      console.warn(`Local storage write failed for ${key}:`, error);
      return false;
    }
  }

  function groups() {
    return Array.from(list.querySelectorAll(':scope > .expanded-group'));
  }

  // Apply persisted disclosure state only after the legacy renderer has created
  // the complete list. This prevents the renderer's default-open state from
  // overwriting saved values before they can be restored.
  function restoreGroupState() {
    const renderedGroups = groups();
    if (!renderedGroups.length || groupsReady) return;
    let saved = {};
    try {
      const raw = safeRead(GROUP_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
    } catch (error) {
      console.warn('Saved quest group state is invalid; using defaults.', error);
    }

    renderedGroups.forEach((group) => {
      const name = group.dataset.groupName;
      if (name && typeof saved[name] === 'boolean') group.open = saved[name];
      group.addEventListener('toggle', () => saveGroupState());
    });
    groupsReady = true;
  }

  function saveGroupState() {
    if (!groupsReady) return;
    const state = Object.fromEntries(groups().filter((group) => group.dataset.groupName)
      .map((group) => [group.dataset.groupName, group.open]));
    safeWrite(GROUP_STATE_KEY, JSON.stringify(state));
  }

  function questRows() {
    return Array.from(list.querySelectorAll('.expanded-row')).map((row) => ({
      row,
      checkbox: row.querySelector('.expanded-check'),
      group: row.closest('.expanded-group'),
      title: row.querySelector('.task-text')?.textContent.trim() || ''
    })).filter((item) => item.checkbox && item.group);
  }

  function expansionKey(groupName) {
    const prefix = (groupName || '').split(' · ')[0].trim().toUpperCase();
    const labels = { ARR: 'A Realm Reborn', HW: 'Heavensward', SB: 'Stormblood', SHB: 'Shadowbringers', EW: 'Endwalker', DT: 'Dawntrail' };
    return labels[prefix] || prefix;
  }

  function populateExpansionFilter() {
    if (!expansionFilter || expansionFilter.dataset.ready) return;
    const options = [...new Set(groups().map((group) => expansionKey(group.dataset.groupName)))];
    options.forEach((name) => {
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
      let groupVisible = 0;
      const groupExpansion = expansionKey(group.dataset.groupName);
      group.querySelectorAll('.expanded-row').forEach((row) => {
        const check = row.querySelector('.expanded-check');
        const title = row.querySelector('.task-text')?.textContent.trim() || '';
        const matchesText = title.toLocaleLowerCase().includes(query);
        const matchesStatus = status === 'all' || (status === 'completed' ? check?.checked : !check?.checked);
        const matchesExpansion = expansion === 'all' || expansion === groupExpansion;
        const visible = matchesText && matchesStatus && matchesExpansion;
        row.hidden = !visible;
        if (visible) { groupVisible += 1; visibleCount += 1; }
      });
      group.hidden = groupVisible === 0;
    });

    if (resultCount) resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'quest' : 'quests'} gevonden`;
    if (noResults) noResults.hidden = visibleCount !== 0;
  }

  function nextIncomplete() {
    return questRows().find(({ checkbox }) => !checkbox.checked) || null;
  }

  function updateResume() {
    const next = nextIncomplete();
    currentNextId = next?.checkbox.dataset.id || null;
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
    // Search/filter visibility must not prevent navigation to the true next MSQ.
    if (searchInput) searchInput.value = '';
    if (progressFilter) progressFilter.value = 'all';
    if (expansionFilter) expansionFilter.value = 'all';
    applyQuestFilters();

    const group = next.group;
    group.hidden = false;
    group.open = true;
    const questId = next.checkbox.dataset.id;
    const target = list.querySelector(`.expanded-check[data-id="${CSS.escape(questId)}"]`)?.closest('.expanded-row');
    if (!target) return;
    target.hidden = false;
    target.classList.remove('resume-highlight');
    void target.offsetWidth;
    target.classList.add('resume-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => target.classList.remove('resume-highlight'), 2400);
  }

  function initializeNote() {
    if (!noteField) return;
    noteField.value = safeRead(NOTE_STORAGE_KEY) || '';
    document.getElementById('saveNote')?.addEventListener('click', () => {
      const saved = safeWrite(NOTE_STORAGE_KEY, noteField.value);
      if (noteMessage) noteMessage.textContent = saved ? 'Notitie opgeslagen.' : 'Opslaan is niet gelukt in deze browser.';
    });
    document.getElementById('clearNote')?.addEventListener('click', () => {
      try { localStorage.removeItem(NOTE_STORAGE_KEY); } catch (error) {
        console.warn('Could not clear the session note:', error);
      }
      noteField.value = '';
      if (noteMessage) noteMessage.textContent = 'Notitie gewist.';
    });
  }

  function initialize() {
    restoreGroupState();
    populateExpansionFilter();
    applyQuestFilters();
    updateResume();
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
    if (!groupsReady && groups().length) initialize();
    else {
      populateExpansionFilter();
      updateResume();
      applyQuestFilters();
    }
  });
  renderObserver.observe(list, { childList: true, subtree: true });
  initialize();
})();
