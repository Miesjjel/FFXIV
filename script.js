/*
 * FFXIV Story & Trailer Tracker
 *
 * Purpose:
 *   This app tracks the chronological story flow of Final Fantasy XIV,
 *   keeps track of completed quests and patch milestones, and reminds the
 *   player which cinematics or trailers still need to be watched.
 *
 * What it does:
 *   - tracks the main story progress in both compact and expanded views
 *   - syncs progress between the compact tracker and the detailed questbook
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
 *   v1.0.1 - Added expanded trailer checkbox, group completion marker, and overview comments.
 *   v1.0.2 - Persisted the selected mode, removed redundant filter buttons, and smoothed group auto-collapse behaviour.
 */

/*
     * FFXIV Story & Trailer Tracker
     *
     * Purpose:
     *   This single-page tracker helps players follow the Final Fantasy XIV story flow,
     *   keep track of which quests, patches, and expansion chapters are complete, and
     *   remember whether each cinematic trailer has been watched.
     *
     * What it does:
     *   - tracks compact story progress across the main game timeline
     *   - supports expanded MSQ questbook viewing with per-group breakdowns
     *   - syncs progress between compact and expanded modes
     *   - links to official trailers for each expansion/patch group
     *   - stores progress in localStorage so it persists in the browser
     *
     * Versioning strategy:
     *   - Start at v1.0.0 and increase the patch number with every meaningful change.
     *   - Major releases change the first number, minor releases the second, and patch updates
     *     the third when making small bug fixes or improvements.
     *   - Example: v1.0.0 -> v1.0.1 -> v1.0.2
     *
     * Version history:
     *   v1.0.0 - Initial tracker release with documented script structure and release notes.
     *   v1.0.1 - Expanded trailer-watched checkboxes and grouped completion logic.
     */
    const STORAGE_KEY = 'ffxiv-story-tracker-v2';
    const MODE_KEY = 'ffxiv-story-tracker-mode';
    const VERSION_HISTORY = [
      { version: 'v1.0.0', notes: 'Initial tracker release with scripted structure, comments, and release versioning.' },
      { version: 'v1.0.1', notes: 'Added expanded trailer-watched checkboxes and group completion tracking.' },
      { version: 'v1.0.2', notes: 'Persisted selected view mode, removed unnecessary filter buttons, and smoothed expanded group auto-collapse behaviour.' }
    ];
    const APP_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1].version;
    let allChecks = [];
    let storyChecks = [];
    let currentMode = 'compact';
    const trailerButtons = Array.from(document.querySelectorAll('.trailer-btn'));
    const cinematicRows = Array.from(document.querySelectorAll('.cinematic-row'));
    const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    const compactFilterButtons = Array.from(document.querySelectorAll('.compact-filters .filter-btn'));
    const compactView = document.getElementById('compactView');
    const expandedView = document.getElementById('expandedView');
    const progressFill = document.getElementById('progressFill');
    const completionText = document.getElementById('completionText');
    const appVersion = document.getElementById('appVersion');
    const nextStepEl = document.getElementById('nextStep');
    const expandedSyncMap = {
      'arr-base': ['ARR · Seventh Umbral Era'],
      'arr-2-1': ['ARR · Seventh Astral Era · Patch 2.1'],
      'arr-2-2': ['ARR · Seventh Astral Era · Patch 2.2'],
      'arr-2-3': ['ARR · Seventh Astral Era · Patch 2.3'],
      'arr-2-4': ['ARR · Seventh Astral Era · Patch 2.4'],
      'arr-2-5': ['ARR · Seventh Astral Era · Patch 2.5', 'ARR · Seventh Astral Era · Patch 2.55'],
      'hw-base': ['HW · Heavensward · Levels 50-51', 'HW · Heavensward · Levels 52-53', 'HW · Heavensward · Levels 54-55', 'HW · Heavensward · Levels 56-57', 'HW · Heavensward · Levels 58-60'],
      'hw-3-1': ['HW · Post-Heavensward · Patch 3.1'],
      'hw-3-2': ['HW · Post-Heavensward · Patch 3.2'],
      'hw-3-3': ['HW · Post-Heavensward · Patch 3.3'],
      'hw-3-4': ['HW · Post-Heavensward · Patch 3.4'],
      'hw-3-5': ['HW · Post-Heavensward · Patch 3.5', 'HW · Post-Heavensward · Patch 3.56'],
      'sb-base': ['SB · Stormblood · Levels 60-61', 'SB · Stormblood · Levels 62-63', 'SB · Stormblood · Levels 64-65', 'SB · Stormblood · Levels 66-67', 'SB · Stormblood · Levels 68-70'],
      'sb-4-1': ['SB · Stormblood'],
      'sb-4-2': ['SB · Stormblood'],
      'sb-4-3': ['SB · Stormblood'],
      'sb-4-4': ['SB · Stormblood'],
      'sb-4-5': ['SB · Stormblood'],
      'shb-base': ['ShB · Shadowbringers'],
      'shb-5-1': ['ShB · Shadowbringers'],
      'shb-5-2': ['ShB · Shadowbringers'],
      'shb-5-3': ['ShB · Shadowbringers'],
      'shb-5-4': ['ShB · Shadowbringers'],
      'shb-5-5': ['ShB · Shadowbringers'],
      'ew-base': ['EW · Endwalker'],
      'ew-6-1': ['EW · Endwalker'],
      'ew-6-2': ['EW · Endwalker'],
      'ew-6-3': ['EW · Endwalker'],
      'ew-6-4': ['EW · Endwalker'],
      'ew-6-5': ['EW · Endwalker'],
      'dt-base': ['DT · Dawntrail'],
      'dt-7-1': ['DT · Dawntrail']
    };
    const expandedQuestBook = [
      { title: 'Close to Home', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'To the Bannock', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Passing Muster', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Chasing Shadows', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Eggs over Queasy', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Surveying the Damage', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'A Soldier\'s Breakfast', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Spirithold Broken', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'On to Bentbranch', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'You Shall Not Trespass', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Don\'t Look Down', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'In the Grim Darkness of the Forest', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Threat Level Elevated', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Migrant Marauders', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'A Hearer Is Often Late', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Salvaging the Scene', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Leia\'s Legacy', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Dread Is in the Air', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'To Guard a Guardian', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Festive Endeavors', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'Renewing the Covenant', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'The Gridanian Envoy', group: 'ARR · Seventh Umbral Era · Levels 1-15' },
      { title: 'It\'s Probably Pirates', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Call of the Forest', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Fire in the Gloom', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Call of the Desert', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Into a Copper Hell', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'The Scions of the Seventh Dawn', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'A Wild Rose by Any Other Name', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Unsolved Mystery', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'What Poor People Think', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'A Proper Burial', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'For the Children', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Amalj\'aa Wrong Places', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Dressed to Deceive', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Life, Materia and Everything', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'Lord of the Inferno', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'A Hero in the Making', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'The Company You Keep', group: 'ARR · Seventh Umbral Era · Levels 15-20' },
      { title: 'First Contact', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Dance Dance Diplomacy', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Forest Friend', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Presence of the Enemy', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Brotherly Love', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Spirited Away', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Druthers House Rules', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Never Forget', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Microbrewing', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Like Fine Wine', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Sylphish Concerns', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Nouveau Riche', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Into the Beast\'s Maw', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'A Simple Gift', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Believe in Your Sylph', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Back from the Wood', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Shadow of Darkness', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Highbridge Times', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Where There Is Smoke', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'On to Little Ala Mhigo', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Tea for Three', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Foot in the Door', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Meeting with the Resistance', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Killing Him Softly', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Helping Horn', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'He Ain\'t Heavy', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Come Highly Recommended', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Big Trouble in Little Ala Mhigo', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Back to Square One', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Terror at Fallgourd', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Ziz Is So Ridiculous', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Seeing Eye to Winged Eye', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Rock of Rancor', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Power of Deduction', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Secret of the White Lily', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Skeletons in Her Closet', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'Wrath of the Titan', group: 'ARR · Seventh Umbral Era · Levels 21-30' },
      { title: 'The Perfect Prey', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'When the Worm Turns', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'There and Back Again', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Things We Do for Cheese', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'What Do You Mean You Forgot the Wine', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'An Offer You Can Refuse', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'It Won\'t Work', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Give a Man a Drink', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'That Weight', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Battle Scars', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'It Was a Very Good Year', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'In the Company of Heroes', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'As You Wish', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Lord of Crags', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'All Good Things', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'You Can\'t Take It with You', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Bringing Out the Dead', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Bury Me Not on the Lone Prairie', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Eyes on Me', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'He Who Waited Behind', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Cold Reception', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Unending War', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Men of Honor', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Three for Three', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Rose and the Unicorn', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Talk of Coerthas', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Road to Redemption', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Following the Evidence', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'In the Eyes of Gods and Men', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Final Flight of the Enterprise', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Ye of Little Faith', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Factual Folklore', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Best Inventions', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Influencing Inquisitors', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'By the Lights of Ishgard', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'Blood for Blood', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'The Heretic among Us', group: 'ARR · Seventh Umbral Era · Levels 31-40' },
      { title: 'In Pursuit of the Past', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Into the Eye of the Storm', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Sealed with Science', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'With the Utmost Care', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'A Promising Prospect', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Representing the Representative', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'The Reluctant Researcher', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Sweet Somethings', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'History Repeating', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'The Curious Case of Giggity', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Better Late than Never', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Lady of the Vortex', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Reclamation', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Casing the Castrum', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Eyes on the Empire', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Footprints in the Snow', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Monumental Hopes', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Notorious Biggs', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Come-Into-My-Castrum', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Getting Even with Garlemald', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Drowning Out the Voices', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Acting the Part', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Dressed for Conquest', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Fool Me Twice', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Every Little Thing She Does Is Magitek', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Escape from Castrum Centri', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'The Black Wolf\'s Ultimatum', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Operation Archon', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'A Hero in Need', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Hearts on Fire', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'Rock the Castrum', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'The Ultimate Weapon', group: 'ARR · Seventh Umbral Era · Levels 41-50' },
      { title: 'The Price of Principles', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'Moving On', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'All Things in Time', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'Laying the Foundation', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'It\'s Possibly a Primal', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'Hail to the King, Kupo', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'You Have Selected Regicide', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'On the Properties of Primals', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'The Gifted', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'Build on the Stone', group: 'ARR · Seventh Astral Era · Patch 2.1' },
      { title: 'Still Waters', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'A Final Temptation', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'The Mother of Exiles', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Promises to Keep', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Yugiri\'s Game', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Why We Adventure', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'All Due Respect', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'The Sea Rises', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Scouts in Distress', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'The Gift of Eternity', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Into the Heart of the Whorl', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Lord of the Whorl', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'When Yugiri Met the Fraternity', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'Through the Maelstrom', group: 'ARR · Seventh Astral Era · Patch 2.2' },
      { title: 'The Great Divide', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Desperate Times', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Shock and Awe', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Reap the Whirlwind', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Revolution', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Stories We Tell', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Lord of Levin', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Levin an Impression', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'What Little Gods Are Made Of', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Guardian of Eorzea', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Recruiting the Realm', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Heretical Harassment', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'When the Cold Sets In', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Brave New Companions', group: 'ARR · Seventh Astral Era · Patch 2.3' },
      { title: 'Traitor in the Midst', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Back and Fourth', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Coming to Terms', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'The Intercession of Saints', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Strength in Unity', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Dark Words, Dark Deeds', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'First Blood', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'The Path of the Righteous', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'For the Greater Good', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Tendrils of Intrigue', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Chasing Ivy', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'In Flagrante Delicto', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'A Simple Plan', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'The Instruments of Our Deliverance', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'The Road Less Traveled', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Eyes Unclouded', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'The Reason Roaille', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Let Us Cling Together', group: 'ARR · Seventh Astral Era · Patch 2.4' },
      { title: 'Good Intentions', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'Bait and Switch', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'Best Laid Schemes', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'The Rising Chorus', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'Aether on Demand', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'On the Counteroffensive', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'An Uninvited Ascian', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'In Memory of Moenbryda', group: 'ARR · Seventh Astral Era · Patch 2.5' },
      { title: 'Mask of Grief', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Defenders for Ishgard', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'The Wyrm\'s Roar', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Committed to the Cause', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Volunteer Dragonslayers', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'An Allied Perspective', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'The Steps of Faith', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Administrative Decision', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'An Unexpected Ambition', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Ancient Ways, Timeless Wants', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Where We Are Needed', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'The Least among Us', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'A Time to Every Purpose', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Come, but Not Gone', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'The Parting Glass', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Before the Dawn', group: 'ARR · Seventh Astral Era · Patch 2.55' },
      { title: 'Coming to Ishgard', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Taking in the Sights', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'The Better Half', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Over the Wall', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Work in Progress', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'The First and Foremost', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'From on High', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Reconnaissance Lost', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'At the End of Our Hope', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Knights Be Not Proud', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Onwards and Upwards', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'An Indispensable Ally', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Meeting the Neighbors', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Sense of Urgency', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Hope Springs Eternal', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'A Series of Unfortunate Events', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'A Reward Long in Coming', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Divine Intervention', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Disclosure', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Flame General Affairs', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'In Search of Raubahn', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Keeping the Flame Alive', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'To Siege or Not to Siege', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Alphinaud\'s Way', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'In Search of Iceheart', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'From One Heretic to Another', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Sounding Out the Amphitheatre', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Camp of the Convictors', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Purple Flame, Purple Flame', group: 'HW · Heavensward · Levels 50-51' },
      { title: 'Where the Chocobos Roam', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Worse than Dragons', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'The Trine Towers', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Gifts for the Outcasts', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'The Nonmind', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'A Gnathic Deity', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Breaking into Hives', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Lord of the Hive', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Mourn in Passing', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Beyond the Clouds', group: 'HW · Heavensward · Levels 52-53' },
      { title: 'Mountaintop Diplomacy', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Moghan\'s Trial', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Mogmug\'s Trial', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Mogwin\'s Trial', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Moglin\'s Judgment', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Leaving Moghome', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'The Road to Zenith', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Waiting for the Wind to Change', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Heart of Ice', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'The Wyrm\'s Lair', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'New Winds, Old Friends', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'A General Summons', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Awakening in Ul\'dah', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'A Brave Resolution', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Ready to Fly', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Into the Aery', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'The Song Begins', group: 'HW · Heavensward · Levels 54-55' },
      { title: 'Unrest in Ishgard', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'He Who Would Not Be Denied', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Ill-weather Friends', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'The Spice of Life', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Noble Indiscretions', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'A Child Apart', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Bloodlines', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Fire and Blood', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'A Knight\'s Calling', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'The Sins of Antiquity', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'In Search of the Soleil', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Into the Blue', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Familiar Faces', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Devourer of Worlds', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Black and the White', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Bolt, Chain, and Island', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'A Difference of Opinion', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'One Good Turn', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'An Engineering Enterprise', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Aetherial Trail', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Lost in the Lifestream', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Tataru\'s Surprise', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'Onward to Sharlayan', group: 'HW · Heavensward · Levels 56-57' },
      { title: 'A Great New Nation', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Golems Begone', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'An Illuminati Incident', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Leaving Idyllshire', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Matoya\'s Cave', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Forbidden Knowledge', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'An Eye for Aether', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Hour of Departure', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'The First Flight of the Excelsior', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Systematic Exploration', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'In Node We Trust', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Chimerical Maintenance', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Close Encounters of the VIth Kind', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Fetters of Lament', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'Heavensward', group: 'HW · Heavensward · Levels 58-60' },
      { title: 'An Uncertain Future', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'Breaking the Cycle', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'Another Time, Another Place', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'In the Eye of the Beholder', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'A Little Slow, a Little Late', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'Dreams of the Lost', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'Against the Dying of the Light', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'As Goes Light, So Goes Darkness', group: 'HW · Post-Heavensward · Patch 3.1' },
      { title: 'As It Once Was', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'The Word of the Mother', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'This War of Ours', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'Staunch Conviction', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'Once More, a Favor', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'For Those We Have Lost', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'Consequences', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'Choices', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'A Spectacle for the Ages', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'For Those We Can Yet Save', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'Causes and Costs', group: 'HW · Post-Heavensward · Patch 3.2' },
      { title: 'The Man Within', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'An Ally for Ishgard', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'Winning Over the Wyrm', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'An End to the Song', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'Heroes of the Hour', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'Litany of Peace', group: 'HW · Post-Heavensward · Patch 3.3' },
      { title: 'Promises Kept', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Shadows of the First', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Two Sides of a Coin', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Unlikely Allies', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'The Beast That Mourned at the Heart of the Mountain', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Beneath a Star-filled Sky', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'When We Were Free', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Honorable Heroes', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'One Life for One World', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'An Ending to Mark a New Beginning', group: 'HW · Post-Heavensward · Patch 3.4' },
      { title: 'Tidings from Gyr Abania', group: 'HW · Post-Heavensward · Patch 3.5' },
      { title: 'An Envoy for Ishgard', group: 'HW · Post-Heavensward · Patch 3.5' },
      { title: 'An Allied Decision', group: 'HW · Post-Heavensward · Patch 3.5' },
      { title: 'Griffin, Griffin on the Wall', group: 'HW · Post-Heavensward · Patch 3.5' },
      { title: 'Louisoix\'s Finest Student', group: 'HW · Post-Heavensward · Patch 3.5' },
      { title: 'The Obvious Solution', group: 'HW · Post-Heavensward · Patch 3.56' },
      { title: 'The Greater Obeisance', group: 'HW · Post-Heavensward · Patch 3.56' },
      { title: 'Fly Free, My Pretty', group: 'HW · Post-Heavensward · Patch 3.56' },
      { title: 'The Far Edge of Fate', group: 'HW · Post-Heavensward · Patch 3.56' },
      { title: 'Beyond the Great Wall', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Lyse Takes the Lead', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Promise of a New Beginning', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Haven for the Bold', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Bargain Struck', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Friend of a Friend in Need', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Signed, Sealed, to Be Delivered', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Best Served with Cold Steel', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Let Fill Your Hearts with Pride', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Familiar Face Forgotten', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Prodigal Daughter', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Hard Country', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Death by a Thousand Rocks', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Life More Ordinary', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Color of Angry Qiqirn', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Black Wolf\'s Pups', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Homeward Bound', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Where Men Go as One', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Future Rust, Future Dust', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Dash of Green', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Ye Wayward Brothers', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Token of Faith', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Crossing the Velodyna', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'In Crimson It Began', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Fires Fade', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Bereft of Hearth and Home', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Divide and Conquer', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Lies, Damn Lies, and Pirates', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Tales from the Far East', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Not without Incident', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'The Man from Ul\'dah', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Where the Streets Are Paved with Koban', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'By the Grace of Lord Lolorito', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'A Good Samurai Is Hard to Find', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'It\'s Probably a Trap', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Making the Catfish Sing', group: 'SB · Stormblood · Levels 60-61' },
      { title: 'Once More, to the Ruby Sea', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Open Water', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Boys with Boats', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'To Bend with the Wind', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Confederate Consternation', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'The Solace of the Sea', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'The Arrows of Misfortune', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'The Last Voyage', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Alisaie\'s Stones', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Under the Sea', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Of Kojin and Kami', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'In Soroban We Trust', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Forever and Ever Apart', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'In Darkness the Magatama Dreams', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'The Whims of the Divine', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Breaking and Delivering', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'The Lord of the Revel', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Tide Goes in, Imperials Go Out', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'A Silence in Three Parts', group: 'SB · Stormblood · Levels 62-63' },
      { title: 'Life after Doma', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'A Glimpse of Madness', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Stubborn Remainder', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Ones We Leave Behind', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'A New Ruby Tithe', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Will to Live', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'Daughter of the Deep', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'Path of No Return', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Time between the Seconds', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'All the Little Angels', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'Here There Be Xaela', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Search for Lord Hien', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'A Season for War', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'An Impossible Dream', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'Stars in the Dark', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'A Warrior\'s Welcome', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Heart of Nations', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'A Trial Before the Trial', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'In the Footsteps of Bardam the Brave', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Children of Azim', group: 'SB · Stormblood · Levels 64-65' },
      { title: 'The Labors of Magnai', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'For Love of the Moon', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Sworn Enemies of the Sun', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Undying Ones', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'A Final Peace', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'As the Gods Will', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Naadam', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Glory to the Khagan', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'In Crimson They Walked', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Hour of Reckoning', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Room Where It Happened', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'How Tataru Got Her Groove Back', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Seeds of Despair', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Limits of Our Endurance', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Broken Steel, Broken Men', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Doma Within', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'On the Eve of Destiny', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Die Is Cast', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The World Turned Upside Down', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'A Swift and Secret Departure', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'While You Were Away', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Rhalgr\'s Beacon', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Fortunes of War', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'Rising Fortunes, Rising Spirits', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Lure of the Dream', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Lady of Bliss', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The Silence of the Gods', group: 'SB · Stormblood · Levels 66-67' },
      { title: 'The First of Many', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Strong and Unified', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Hells Open', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Heavens Weep', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Road Home', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'For the Living and the Dead', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Above the Churning Waters', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Path Forward', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'With Tired Hands We Toil', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Where Courage Endures', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Price of Freedom', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Raubahn\'s Invitation', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Liberty or Death', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Lady in Red', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Upon the Great Loch\'s Shore', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Key to Victory', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Resonant', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Legacy of Our Fathers', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'The Measure of His Reach', group: 'SB · Stormblood · Levels 68-70' },
      { title: 'Stormblood', group: 'SB · Stormblood · Levels 68-70' }
    ];

    /**
     * Creates a stable DOM selector ID for each expanded MSQ row.
     * This keeps checkbox state predictable across re-renders.
     */
    function makeExpandedQuestId(item) {
      const base = `${item.group} ${item.title}`.toLowerCase();
      return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    /**
     * Creates a unique ID for the trailer-watched checkbox on each group.
     */
    function makeExpandedTrailerId(groupName) {
      return `expanded-trailer-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    }

    /**
     * Maps compact tracker IDs back to the matching expanded quest IDs.
     * This keeps the compact and expanded views synchronized.
     */
    function getExpandedIdsForCompactId(compactId) {
      const prefixes = expandedSyncMap[compactId] || [];
      if (!prefixes.length) return [];

      return expandedQuestBook
        .filter((item) => prefixes.some((prefix) => item.group.startsWith(prefix)))
        .map((item) => makeExpandedQuestId(item));
    }

    /**
     * Mirrors a compact checkbox change to the matching expanded quest rows.
     * This avoids duplicated logic and keeps both views consistent.
     */
    function syncExpandedFromCompact(compactId, checked) {
      const ids = getExpandedIdsForCompactId(compactId);
      const expandedCheckMap = new Map(
        Array.from(document.querySelectorAll('.expanded-check')).map((input) => [input.dataset.id, input])
      );

      ids.forEach((id) => {
        const input = expandedCheckMap.get(id);
        if (input && input.checked !== checked) {
          input.checked = checked;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    /**
     * Returns the relevant YouTube trailer target for an expansion or patch group.
     */
    function getExpandedGroupTrailer(groupName) {
      if (!groupName) return null;

      const patchMatch = groupName.match(/Patch\s+(\d+\.\d+)/i);
      if (patchMatch) {
        const patch = patchMatch[1];
        return {
          href: `https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Patch+${patch}+official+trailer`,
          label: `Watch Patch ${patch} Trailer`
        };
      }

      if (groupName.toLowerCase().includes('arr')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+A+Realm+Reborn+official+trailer',
          label: 'Watch ARR Trailer'
        };
      }

      if (groupName.toLowerCase().includes('heavensward')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Heavensward+official+trailer',
          label: 'Watch Heavensward Trailer'
        };
      }

      if (groupName.toLowerCase().includes('stormblood')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Stormblood+official+trailer',
          label: 'Watch Stormblood Trailer'
        };
      }

      if (groupName.toLowerCase().includes('shadowbringers')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Shadowbringers+official+trailer',
          label: 'Watch Shadowbringers Trailer'
        };
      }

      if (groupName.toLowerCase().includes('endwalker')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Endwalker+official+trailer',
          label: 'Watch Endwalker Trailer'
        };
      }

      if (groupName.toLowerCase().includes('dawntrail')) {
        return {
          href: 'https://www.youtube.com/results?search_query=Final+Fantasy+XIV+Dawntrail+official+trailer',
          label: 'Watch Dawntrail Trailer'
        };
      }

      return null;
    }

    /**
     * Checks whether every quest in a specific group is complete.
     * This drives the green completion badge and auto-collapse behavior.
     */
    function isExpandedGroupComplete(groupName) {
      const items = expandedQuestBook.filter((item) => item.group === groupName);
      if (!items.length) return false;

      const checkboxMap = new Map(
        Array.from(document.querySelectorAll('.expanded-check')).map((input) => [input.dataset.id, input])
      );

      return items.every((item) => {
        const id = makeExpandedQuestId(item);
        const checkbox = checkboxMap.get(id);
        return Boolean(checkbox && checkbox.checked);
      });
    }

    /**
     * Updates the summary badge for each expanded group.
     * If all quests in a section are checked, it marks the section complete and collapses it.
     */
    function updateExpandedGroupStatus() {
      document.querySelectorAll('#expandedView .expanded-group').forEach((group) => {
        const summary = group.querySelector('summary');
        if (!summary) return;

        const groupName = group.dataset.groupName || '';
        const complete = isExpandedGroupComplete(groupName);
        const count = group.dataset.count || '0';
        const previousState = group.dataset.complete === 'true';

        summary.innerHTML = `
          <span class="group-title-wrap">
            <span class="group-label">${groupName}</span>
          </span>
          <span class="summary-meta">
            <span class="group-count">${count}</span>
            <span class="group-status ${complete ? 'complete' : ''}" title="${complete ? 'All quests complete' : 'Progress in this group'}">${complete ? '✓' : ''}</span>
          </span>
        `;

        group.dataset.complete = String(complete);
        group.classList.toggle('group-complete', complete);

        if (complete && !previousState) {
          group.open = false;
        }
      });
    }

    /**
     * Builds the expanded questbook UI from the grouped data set.
     * This function creates each group, trailer row, and quest row in one pass.
     */
    function renderExpandedQuestBook() {
      const listEl = document.getElementById('expandedQuestBook');
      if (!listEl) return;

      listEl.innerHTML = '';

      const grouped = new Map();
      expandedQuestBook.forEach((item) => {
        const key = item.group;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
      });

      Array.from(grouped.entries()).forEach(([groupName, items]) => {
        const group = document.createElement('details');
        group.className = 'expanded-group';
        group.dataset.groupName = groupName;
        group.dataset.count = String(items.length);
        group.open = true;

        const summary = document.createElement('summary');
        summary.innerHTML = `
          <span class="group-title-wrap">
            <span class="group-label">${groupName}</span>
          </span>
          <span class="summary-meta">
            <span class="group-count">${items.length}</span>
            <span class="group-status" title="Progress in this group"></span>
          </span>
        `;

        const inner = document.createElement('div');
        inner.className = 'expanded-group-inner';

        const trailer = getExpandedGroupTrailer(groupName);
        const trailerRow = document.createElement('div');
        trailerRow.className = 'group-trailer-row';

        if (trailer) {
          const trailerLink = document.createElement('a');
          trailerLink.className = 'trailer-btn visible';
          trailerLink.href = trailer.href;
          trailerLink.target = '_blank';
          trailerLink.rel = 'noreferrer';
          trailerLink.textContent = trailer.label;
          trailerRow.appendChild(trailerLink);
        }

        const trailerCheckLabel = document.createElement('label');
        trailerCheckLabel.className = 'group-trailer-check';
        const trailerCheckId = makeExpandedTrailerId(groupName);
        trailerCheckLabel.innerHTML = `
          <input class="expanded-trailer-check" type="checkbox" data-id="${trailerCheckId}" />
          <span>Trailer gekeken</span>
        `;
        trailerRow.appendChild(trailerCheckLabel);
        inner.appendChild(trailerRow);

        const list = document.createElement('ul');
        list.className = 'expanded-group-list';

        items.forEach((item) => {
          const id = makeExpandedQuestId(item);
          const isMustDo = Boolean(item.kind === 'blue');
          const row = document.createElement('li');
          row.className = `expanded-row ${isMustDo ? 'must' : 'story'}`;
          row.innerHTML = `
            <div class="quest-main">
              <label class="task main-task">
                <input class="expanded-check" type="checkbox" data-id="${id}" />
                <span class="task-text">${item.title}</span>
              </label>
            </div>
            <div class="quest-meta"><span class="tag ${isMustDo ? 'must-tag' : 'story-tag'}">${isMustDo ? 'Must do' : 'MSQ'}</span></div>
            <p>${isMustDo ? 'Blue / unlocker quest — only keep it if it is genuinely required for progression.' : 'Main scenario quest — part of the story chronology.'}</p>
          `;
          list.appendChild(row);
        });

        inner.appendChild(list);
        group.appendChild(summary);
        group.appendChild(inner);
        listEl.appendChild(group);
      });

      updateExpandedGroupStatus();
    }

    /**
     * Returns the matching compact prerequisite checkbox for the given data ID.
     */
    function getPrereqItem(prereqId) {
      return prereqId ? document.querySelector(`input.story-check[data-id="${prereqId}"]`) : null;
    }

    /**
     * Calculates the overall completion percentage and updates the progress bar label.
     */
    function updateProgress() {
      const total = allChecks.length;
      const complete = allChecks.filter((item) => item.checked).length;
      const percent = total ? Math.round((complete / total) * 100) : 0;

      progressFill.style.width = `${percent}%`;
      completionText.textContent = `${complete} / ${total} Complete`;
      if (appVersion) appVersion.textContent = APP_VERSION;
    }

    /**
     * Reveals and enables prerequisite-dependent UI elements after story progress advances.
     */
    function updateUnlocks() {
      trailerButtons.forEach((button) => {
        button.classList.add('visible');
      });

      cinematicRows.forEach((row) => {
        row.classList.add('visible');
      });
    }

    function reorderCinematicRows() {
      document.querySelectorAll('.milestone').forEach((milestone) => {
        const taskWrap = milestone.querySelector('.task-wrap');
        if (!taskWrap) return;

        const mainTask = taskWrap.querySelector('.main-task');
        const cinematicRow = taskWrap.querySelector('.cinematic-row');

        if (mainTask && cinematicRow && (mainTask.compareDocumentPosition(cinematicRow) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          taskWrap.insertBefore(cinematicRow, mainTask);
        }
      });
    }

    function normalizeCinematicLabels() {
      document.querySelectorAll('.cinematic-row .task-text').forEach((label) => {
        const text = label.textContent.trim();
        const normalized = text.replace(/^Watch Patch (.+) cinematic$/, 'Before starting Patch $1: watch the cinematic');
        if (normalized !== text) {
          label.textContent = normalized;
        }
      });
    }

    function updateNextStep() {
      const next = storyChecks.find((item) => !item.checked);
      if (!next) {
        nextStepEl.textContent = 'All story milestones complete — time to revisit the best cutscenes.';
        return;
      }

      const milestone = next.closest('.milestone');
      const label = milestone ? milestone.querySelector('.task-text').textContent.trim() : 'Next milestone';
      nextStepEl.textContent = 'Next recommended step: ' + label;
    }

    function applyCompactFilters() {
      const active = document.querySelector('.compact-filters .filter-btn.active')?.dataset.filter || 'all';
      const rows = Array.from(document.querySelectorAll('#compactView .milestone'));

      rows.forEach((row) => {
        const storyBox = row.querySelector('.story-check');
        const remaining = storyBox && !storyBox.checked;
        const hasCinematic = Array.from(row.querySelectorAll('.cinematic-row input')).some((input) => !input.checked);

        let shouldShow = true;
        if (active === 'remaining') shouldShow = !!remaining;
        if (active === 'cinema') shouldShow = !!hasCinematic;

        row.classList.toggle('is-hidden', !shouldShow);
      });
    }

    function applyFilters() {
      applyCompactFilters();
    }

    function setMode(mode) {
      const compact = mode === 'compact';
      currentMode = mode;
      compactView.classList.toggle('is-hidden', !compact);
      expandedView.classList.toggle('is-hidden', compact);

      modeButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.mode === mode);
      });

      document.querySelector('.compact-filters').classList.toggle('is-hidden', !compact);
      localStorage.setItem(MODE_KEY, mode);
      applyFilters();
    }

    function refreshCheckRefs() {
      allChecks = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      storyChecks = Array.from(document.querySelectorAll('.story-check'));
    }

    /**
     * Persists the current form state so the tracker survives page reloads.
     */
    function saveState() {
      const state = Object.fromEntries(
        allChecks
          .filter((item) => item.dataset && item.dataset.id)
          .map((item) => [item.dataset.id, item.checked])
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: currentMode,
          checks: state
        })
      );
      updateProgress();
      updateUnlocks();
      updateNextStep();
      updateExpandedGroupStatus();
      applyFilters();
    }

    /**
     * Restores any stored checkbox state from localStorage when the page loads.
     */
    function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const rememberedMode = localStorage.getItem(MODE_KEY) || 'compact';
        setMode(rememberedMode);
        return;
      }

      try {
        const saved = JSON.parse(raw);
        const checks = saved && typeof saved === 'object' && Object.prototype.hasOwnProperty.call(saved, 'checks')
          ? saved.checks
          : saved;
        const rememberedMode = saved && typeof saved === 'object' && saved.mode
          ? saved.mode
          : localStorage.getItem(MODE_KEY) || 'compact';

        allChecks.forEach((item) => {
          if (item.dataset && item.dataset.id && Object.prototype.hasOwnProperty.call(checks, item.dataset.id)) {
            item.checked = Boolean(checks[item.dataset.id]);
          }
        });

        setMode(rememberedMode);
      } catch (error) {
        console.warn('Failed to parse saved tracker state:', error);
        setMode(localStorage.getItem(MODE_KEY) || 'compact');
      }
    }

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.mode));
    });

    compactFilterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        compactFilterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
        applyCompactFilters();
      });
    });

    renderExpandedQuestBook();
    refreshCheckRefs();

    allChecks.forEach((item) => {
      item.addEventListener('change', () => {
        if (item.classList.contains('story-check')) {
          syncExpandedFromCompact(item.dataset.id, item.checked);
        }
        saveState();
      });
    });

    loadState();
    reorderCinematicRows();
    normalizeCinematicLabels();
    setMode(currentMode || 'compact');
    updateProgress();
    updateUnlocks();
    updateNextStep();
    updateExpandedGroupStatus();
    applyFilters();
  