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
 */
    const STORAGE_KEY = 'ffxiv-story-tracker-v2';
    const VERSION_HISTORY = [
      { version: 'v1.0.0', notes: 'Initial tracker release with scripted structure, comments, and release versioning.' },
      { version: 'v1.0.1', notes: 'Added expanded trailer-watched checkboxes and group completion tracking.' },
      { version: 'v1.0.2', notes: 'Persisted selected view mode, removed unnecessary filter buttons, and smoothed expanded group auto-collapse behaviour.' },
      { version: 'v1.0.3', notes: 'Recalculated the next recommended step strictly from the expanded questbook.' },
      { version: 'v1.0.4', notes: 'Locked the tracker to the expanded questbook as the single source of truth.' },
      { version: 'v1.0.5', notes: 'Showed completed and total quests for each expanded group.' },
      { version: 'v1.0.6', notes: 'Added complete MSQ coverage through Dawntrail patch 7.56 and group completion controls.' }
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
      { title: 'Stormblood', group: 'SB · Stormblood · Levels 68-70' },
      { title: "Arenvald\u0027s Adventure", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "The Darkness Below", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "The Mad King\u0027s Trove", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "The Butcher\u0027s Blood", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "Echoes of an Echo", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "A Sultana\u0027s Strings", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "A Sultana\u0027s Duty", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "A Sultana\u0027s Resolve", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "Securing the Saltery", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "A Blissful Arrival", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "Return of the Bull", group: "SB · Post-Stormblood · Patch 4.1" },
      { title: "Tidings from the East", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "The Sword in the Store", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "Hope on the Waves", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "Elation and Trepidation", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "Storm on the Horizon", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "His Forgotten Home", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "A Guilty Conscience", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "Rise of a New Sun", group: "SB · Post-Stormblood · Patch 4.2" },
      { title: "Gosetsu and Tsuyu", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Gone Like the Morning Dew", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Fruits of Her Labor", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Conscripts and Contingencies", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "The Primary Agreement", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Under the Moonlight", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Emissary of the Dawn", group: "SB · Post-Stormblood · Patch 4.3" },
      { title: "Sisterly Act", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "Feel the Burn", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "Shadows in the Empire", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "A Power in Slumber", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "The Will of the Moon", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "The Call", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "Prelude in Violet", group: "SB · Post-Stormblood · Patch 4.4" },
      { title: "Soul Searching", group: "SB · Post-Stormblood · Patch 4.5" },
      { title: "A Defector\u0027s Tidings", group: "SB · Post-Stormblood · Patch 4.5" },
      { title: "Seiryu\u0027s Wall", group: "SB · Post-Stormblood · Patch 4.5" },
      { title: "Parley on the Front Lines", group: "SB · Post-Stormblood · Patch 4.5" },
      { title: "The Face of War", group: "SB · Post-Stormblood · Patch 4.5" },
      { title: "A Brief Reprieve", group: "SB · Post-Stormblood · Patch 4.56" },
      { title: "A Requiem for Heroes", group: "SB · Post-Stormblood · Patch 4.56" },
      { title: "The Syrcus Trench", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "City of the First", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Travelers of Norvrandt", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "In Search of Alphinaud", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Still Tide", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Open Arms, Closed Gate", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Fickle Existence", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "City of Final Pleasures", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Free to Sightsee", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Taste of Honey", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Blessed Instrument", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Emergent Splendor", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "In Search of Alisaie", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "City of the Mord", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Working Off the Meal", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Desert Crossing", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Following in Her Footprints", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Culling Their Ranks", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "A Purchase of Fruit", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "The Time Left to Us", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Tears on the Sand", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "The Lightwardens", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "Warrior of Darkness", group: "SHB · Shadowbringers · Levels 70-71" },
      { title: "An Unwelcome Guest", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Crystarium\u0027s Resolve", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Logistics of War", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Oracle of Light", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Il Mheg, the Faerie Kingdom", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Sul Uin\u0027s Request", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Ys Iala\u0027s Errand", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Oul Sigun\u0027s Plea", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Unto the Truth", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Courting Cooperation", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Key to the Castle", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "A Visit to the Nu Mou", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "A Fitting Payment", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Spore Sweeper", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Lawless Ones", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Elder\u0027s Answer", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "A Resounding Roar", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Memento of a Friend", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "Acht-la Ormh Inn", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "The Wheel Turns", group: "SHB · Shadowbringers · Levels 72-73" },
      { title: "A Party Soon Divided", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "A Little Faith", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Into the Dark", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "A Day in the Neighborhood", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "A Helping Hand", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Lost but Not Forgotten", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Saying Goodbye", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Stirring up Trouble", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "A Beeautiful Plan", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "An Unwanted Proposal", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Put to the Proof", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Into the Wood", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Top of the Tree", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Look to the Stars", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Mi Casa, Toupasa", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Legend of the Not-so-hidden Temple", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "The Aftermath", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "In Good Faith", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "The Burden of Knowledge", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Bearing With It", group: "SHB · Shadowbringers · Levels 74-75" },
      { title: "Out of the Wood", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "When It Rains", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Word from On High", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Small Favors", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "The Best Way Out", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Free Trade", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "The Trolley Problem", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Rust and Ruin", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "On Track", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Down for Maintenance", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "The Truth Hurts", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "A Convenient Distraction", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "A Dirty Job", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Have a Heart", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Full Steam Ahead", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Crossing Paths", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "A Fresh Start", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "More than a Hunch", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Return to Eulmore", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "A Feast of Lies", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "Paradise Fallen", group: "SHB · Shadowbringers · Levels 76-77" },
      { title: "The Ladder", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "The View from Above", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "In Mt. Gulg\u0027s Shadow", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "A Gigantic Undertaking", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "Meet the Tholls", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "A-Digging We Will Go", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "The Duergar\u0027s Tewel", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "Rich Veins of Hope", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "That None Shall Ever Again", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "A Breath of Respite", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "Extinguishing the Last Light", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "Reassuring the Masses", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "In His Garden", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "The Unbroken Thread", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "To Storm-tossed Seas", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "Waiting in the Depths", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "City of the Ancients", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "The Light of Inspiration", group: "SHB · Shadowbringers · Levels 78-79" },
      { title: "The Illuminated Land", group: "SHB · Shadowbringers · Level 80" },
      { title: "The End of a World", group: "SHB · Shadowbringers · Level 80" },
      { title: "A Greater Purpose", group: "SHB · Shadowbringers · Level 80" },
      { title: "Shadowbringers", group: "SHB · Shadowbringers · Level 80" },
      { title: "Shaken Resolve", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "A Grand Adventure", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "A Welcome Guest", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Good for the Soul", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Nowhere to Turn", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "A Notable Absence", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "For the People", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Finding Good Help", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Moving Forward", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Vows of Virtue, Deeds of Cruelty", group: "SHB · Post-Shadowbringers · Patch 5.1" },
      { title: "Old Enemies, New Threats", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "The Way Home", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "Seeking Counsel", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "Facing the Truth", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "A Sleep Disturbed", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "An Old Friend", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "Deep Designs", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "A Whale\u0027s Tale", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "Beneath the Surface", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "Echoes of a Fallen Star", group: "SHB · Post-Shadowbringers · Patch 5.2" },
      { title: "In the Name of the Light", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Heroic Dreams", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Fraying Threads", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Food for the Soul", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Faded Memories", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Etched in the Stars", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "The Converging Light", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Hope\u0027s Confluence", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Nothing Unsaid", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "The Journey Continues", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Unto the Morrow", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Reflections in Crystal", group: "SHB · Post-Shadowbringers · Patch 5.3" },
      { title: "Alisaie\u0027s Quest", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "The Wisdom of Allag", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "Reviving the Legacy", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "Forget Us Not", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "Like Master, Like Pupil", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "The Admiral\u0027s Resolve", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "The Search for Sicard", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "On Rough Seas", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "The Great Ship Vylbrand", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "Futures Rewritten", group: "SHB · Post-Shadowbringers · Patch 5.4" },
      { title: "Unto the Breach", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "Here Be Dragons", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "Righteous Indignation", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "For Vengeance", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "The Flames of War", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "When the Dust Settles", group: "SHB · Post-Shadowbringers · Patch 5.5" },
      { title: "The Company We Keep", group: "SHB · Post-Shadowbringers · Patch 5.55" },
      { title: "On Official Business", group: "SHB · Post-Shadowbringers · Patch 5.55" },
      { title: "Death Unto Dawn", group: "SHB · Post-Shadowbringers · Patch 5.55" },
      { title: "The Next Ship to Sail", group: "EW · Endwalker · Levels 80-81" },
      { title: "Old Sharlayan, New to You", group: "EW · Endwalker · Levels 80-81" },
      { title: "Hitting the Books", group: "EW · Endwalker · Levels 80-81" },
      { title: "A Seat at the Last Stand", group: "EW · Endwalker · Levels 80-81" },
      { title: "A Labyrinthine Descent", group: "EW · Endwalker · Levels 80-81" },
      { title: "Glorified Ratcatcher", group: "EW · Endwalker · Levels 80-81" },
      { title: "Deeper into the Maze", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Medial Circuit", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Full Report, Warts and All", group: "EW · Endwalker · Levels 80-81" },
      { title: "A Guide of Sorts", group: "EW · Endwalker · Levels 80-81" },
      { title: "Estate Visitor", group: "EW · Endwalker · Levels 80-81" },
      { title: "For Thavnair Bound", group: "EW · Endwalker · Levels 80-81" },
      { title: "On Low Tide", group: "EW · Endwalker · Levels 80-81" },
      { title: "A Fisherman\u0027s Friend", group: "EW · Endwalker · Levels 80-81" },
      { title: "House of Divinities", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Great Work", group: "EW · Endwalker · Levels 80-81" },
      { title: "Shadowed Footsteps", group: "EW · Endwalker · Levels 80-81" },
      { title: "A Boy\u0027s Errand", group: "EW · Endwalker · Levels 80-81" },
      { title: "Tipping the Scale", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Satrap of Radz-at-Han", group: "EW · Endwalker · Levels 80-81" },
      { title: "In the Dark of the Tower", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Jewel of Thavnair", group: "EW · Endwalker · Levels 80-81" },
      { title: "The Color of Joy", group: "EW · Endwalker · Levels 80-81" },
      { title: "Sound the Bell, School\u0027s In", group: "EW · Endwalker · Levels 82-83" },
      { title: "A Capital Idea", group: "EW · Endwalker · Levels 82-83" },
      { title: "Best of the Best", group: "EW · Endwalker · Levels 82-83" },
      { title: "A Frosty Reception", group: "EW · Endwalker · Levels 82-83" },
      { title: "Tracks in the Snow", group: "EW · Endwalker · Levels 82-83" },
      { title: "How the Mighty Are Fallen", group: "EW · Endwalker · Levels 82-83" },
      { title: "At the End of the Trail", group: "EW · Endwalker · Levels 82-83" },
      { title: "A Way Forward", group: "EW · Endwalker · Levels 82-83" },
      { title: "The Last Bastion", group: "EW · Endwalker · Levels 82-83" },
      { title: "Personae non Gratae", group: "EW · Endwalker · Levels 82-83" },
      { title: "His Park Materials", group: "EW · Endwalker · Levels 82-83" },
      { title: "No Good Deed", group: "EW · Endwalker · Levels 82-83" },
      { title: "Alea Iacta Est", group: "EW · Endwalker · Levels 82-83" },
      { title: "Strange Bedfellows", group: "EW · Endwalker · Levels 82-83" },
      { title: "In from the Cold", group: "EW · Endwalker · Levels 82-83" },
      { title: "Gateway of the Gods", group: "EW · Endwalker · Levels 82-83" },
      { title: "A Trip to the Moon", group: "EW · Endwalker · Levels 82-83" },
      { title: "Sea of Sorrow", group: "EW · Endwalker · Levels 82-83" },
      { title: "The Martyr", group: "EW · Endwalker · Levels 82-83" },
      { title: "In Shadow\u0027s Wake", group: "EW · Endwalker · Levels 84-85" },
      { title: "Helping Hands", group: "EW · Endwalker · Levels 84-85" },
      { title: "A Harey Situation", group: "EW · Endwalker · Levels 84-85" },
      { title: "A Taste of the Moon", group: "EW · Endwalker · Levels 84-85" },
      { title: "Styled a Hero", group: "EW · Endwalker · Levels 84-85" },
      { title: "All\u0027s Vale That Endsvale", group: "EW · Endwalker · Levels 84-85" },
      { title: "Back to Old Tricks", group: "EW · Endwalker · Levels 84-85" },
      { title: "Setting Things Straight", group: "EW · Endwalker · Levels 84-85" },
      { title: "Heart of the Matter", group: "EW · Endwalker · Levels 84-85" },
      { title: "Returning Home", group: "EW · Endwalker · Levels 84-85" },
      { title: "Skies Aflame", group: "EW · Endwalker · Levels 84-85" },
      { title: "The Blasphemy Unmasked", group: "EW · Endwalker · Levels 84-85" },
      { title: "Amidst the Apocalypse", group: "EW · Endwalker · Levels 84-85" },
      { title: "Beyond the Depths of Despair", group: "EW · Endwalker · Levels 84-85" },
      { title: "That We Might Live", group: "EW · Endwalker · Levels 84-85" },
      { title: "When All Hope Seems Lost", group: "EW · Endwalker · Levels 84-85" },
      { title: "Warm Hearts, Rekindled Hopes", group: "EW · Endwalker · Levels 84-85" },
      { title: "Simple Pleasures", group: "EW · Endwalker · Levels 84-85" },
      { title: "Under His Wing", group: "EW · Endwalker · Levels 84-85" },
      { title: "At World\u0027s End", group: "EW · Endwalker · Levels 84-85" },
      { title: "Return to the Crystarium", group: "EW · Endwalker · Levels 86-87" },
      { title: "Hope Upon a Flower", group: "EW · Endwalker · Levels 86-87" },
      { title: "Petalouda Hunt", group: "EW · Endwalker · Levels 86-87" },
      { title: "In Search of Hermes", group: "EW · Endwalker · Levels 86-87" },
      { title: "Ponder, Warrant, Cherish, Welcome", group: "EW · Endwalker · Levels 86-87" },
      { title: "Lives Apart", group: "EW · Endwalker · Levels 86-87" },
      { title: "Their Greatest Contribution", group: "EW · Endwalker · Levels 86-87" },
      { title: "Aether to Aether", group: "EW · Endwalker · Levels 86-87" },
      { title: "A Sentimental Gift", group: "EW · Endwalker · Levels 86-87" },
      { title: "Verdict and Execution", group: "EW · Endwalker · Levels 86-87" },
      { title: "Travelers at the Crossroads", group: "EW · Endwalker · Levels 86-87" },
      { title: "A Past, Not Yet Come to Pass", group: "EW · Endwalker · Levels 86-87" },
      { title: "Witness to the Spectacle", group: "EW · Endwalker · Levels 86-87" },
      { title: "Worthy of His Back", group: "EW · Endwalker · Levels 86-87" },
      { title: "A Flower upon Your Return", group: "EW · Endwalker · Levels 86-87" },
      { title: "Hunger in the Garden", group: "EW · Endwalker · Levels 86-87" },
      { title: "Words without Sound", group: "EW · Endwalker · Levels 86-87" },
      { title: "Follow, Wander, Stumble, Listen", group: "EW · Endwalker · Levels 86-87" },
      { title: "Caging the Messenger", group: "EW · Endwalker · Levels 86-87" },
      { title: "Thou Must Live, Die, and Know", group: "EW · Endwalker · Levels 86-87" },
      { title: "As the Heavens Burn", group: "EW · Endwalker · Levels 88-89" },
      { title: "Outside Help", group: "EW · Endwalker · Levels 88-89" },
      { title: "Going Underground", group: "EW · Endwalker · Levels 88-89" },
      { title: "No Job Too Small", group: "EW · Endwalker · Levels 88-89" },
      { title: "Wise Guides", group: "EW · Endwalker · Levels 88-89" },
      { title: "Agriculture Shock", group: "EW · Endwalker · Levels 88-89" },
      { title: "Sage Council", group: "EW · Endwalker · Levels 88-89" },
      { title: "Hither and Yarns", group: "EW · Endwalker · Levels 88-89" },
      { title: "Once Forged", group: "EW · Endwalker · Levels 88-89" },
      { title: "Bonds of Adamant(ite)", group: "EW · Endwalker · Levels 88-89" },
      { title: "Her Children, One and All", group: "EW · Endwalker · Levels 88-89" },
      { title: "A Bold Decision", group: "EW · Endwalker · Levels 88-89" },
      { title: "Friends Gathered", group: "EW · Endwalker · Levels 88-89" },
      { title: "Unto the Heavens", group: "EW · Endwalker · Levels 88-89" },
      { title: "A Strange New World", group: "EW · Endwalker · Levels 88-89" },
      { title: "On Burdεned ωings", group: "EW · Endwalker · Levels 88-89" },
      { title: "A Test of Wιll", group: "EW · Endwalker · Levels 88-89" },
      { title: "Roads Pαved││Sacri┣ice", group: "EW · Endwalker · Levels 88-89" },
      { title: "F//εsh AbanΔon┨Δ", group: "EW · Endwalker · Levels 88-89" },
      { title: "Where Kn∞wledge Leads", group: "EW · Endwalker · Levels 88-89" },
      { title: "Vic┨οry ̈ ̈ ̈╳, │̆││ε Lost", group: "EW · Endwalker · Level 90" },
      { title: "┣┨̈//̈ No┨ΦounΔ•••", group: "EW · Endwalker · Level 90" },
      { title: "Hello, World", group: "EW · Endwalker · Level 90" },
      { title: "Forge Ahead", group: "EW · Endwalker · Level 90" },
      { title: "You\u0027re Not Alone", group: "EW · Endwalker · Level 90" },
      { title: "Endwalker", group: "EW · Endwalker · Level 90" },
      { title: "Newfound Adventure", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Bountiful Ruins", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Friends for the Road", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Alzadaal\u0027s Legacy", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "A Brother\u0027s Grief", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Sharing the Wealth", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Bridging the Rift", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Restricted Reading", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "Void Theory", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "A Satrap\u0027s Duty", group: "EW · Post-Endwalker · Patch 6.1" },
      { title: "In Search of Azdaja", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Shadowed Remnants", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Where Everything Begins", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Groping in the Dark", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Nowhere to Run", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "The Wind Rises", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Return from the Void", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "A World with Light and Life", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Buried Memory", group: "EW · Post-Endwalker · Patch 6.2" },
      { title: "Once More unto the Void", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "A Cold Reunion", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "Kindled Spirit", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "An Unforeseen Bargain", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "King of the Mountain", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "A Dragon\u0027s Resolve", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "Paths Barred", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "Desires Untold", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "Gods Revel, Lands Tremble", group: "EW · Post-Endwalker · Patch 6.3" },
      { title: "Currying Flavor", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Going Haam", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Like Fear to Flame", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "The Fallen Empire", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Bonds of Trust", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Lunar Rendezvous", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "The Red Side of the Moon", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Abyssal Dark", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "The Dark Throne", group: "EW · Post-Endwalker · Patch 6.4" },
      { title: "Seeking the Light", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "Appealing to the Masses", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "In Defiance of Fate", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "Back to Action", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "Down in the Dark", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "Reunited at Last", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "Growing Light", group: "EW · Post-Endwalker · Patch 6.5" },
      { title: "When One Door Closes...", group: "EW · Post-Endwalker · Patch 6.55" },
      { title: "The Game Is Afoot", group: "EW · Post-Endwalker · Patch 6.55" },
      { title: "The Coming Dawn", group: "EW · Post-Endwalker · Patch 6.55" },
      { title: "A New World to Explore", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Nation of Tuliyollal", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A City of Stairs", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A Saga in Stone", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Rite of Succession", group: "DT · Dawntrail · Levels 90-91" },
      { title: "To Kozama\u0027uka", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A Festive People", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Feat of Reeds", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A Well-mannered Shipwright", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Lifting of Wings", group: "DT · Dawntrail · Levels 90-91" },
      { title: "Knowing the Hanuhanu", group: "DT · Dawntrail · Levels 90-91" },
      { title: "To Urqopacha", group: "DT · Dawntrail · Levels 90-91" },
      { title: "Traders of Happiness", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Feat of Gold", group: "DT · Dawntrail · Levels 90-91" },
      { title: "Mablu\u0027s Dream", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A Premium Deal", group: "DT · Dawntrail · Levels 90-91" },
      { title: "Wuk Lamat in the Saddle", group: "DT · Dawntrail · Levels 90-91" },
      { title: "Knowing the Pelupelu", group: "DT · Dawntrail · Levels 90-91" },
      { title: "The Success of Others", group: "DT · Dawntrail · Levels 90-91" },
      { title: "For All Turali", group: "DT · Dawntrail · Levels 90-91" },
      { title: "A Leaking Workpot", group: "DT · Dawntrail · Levels 92-93" },
      { title: "Lending a Helphand", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Feat of Pots", group: "DT · Dawntrail · Levels 92-93" },
      { title: "A Father First", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Shape of Peace", group: "DT · Dawntrail · Levels 92-93" },
      { title: "Lost Promise", group: "DT · Dawntrail · Levels 92-93" },
      { title: "A Brother\u0027s Duty", group: "DT · Dawntrail · Levels 92-93" },
      { title: "Feeding the River", group: "DT · Dawntrail · Levels 92-93" },
      { title: "Sibling Rescue", group: "DT · Dawntrail · Levels 92-93" },
      { title: "History\u0027s Keepers", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Feat of Proof", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The High Luminary", group: "DT · Dawntrail · Levels 92-93" },
      { title: "An Echo of Madness", group: "DT · Dawntrail · Levels 92-93" },
      { title: "Pointing the Way", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Skyruin", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Feat of Ice", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Promise of Peace", group: "DT · Dawntrail · Levels 92-93" },
      { title: "The Leap to Yak T\u0027el", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Village of the Hunt", group: "DT · Dawntrail · Levels 94-95" },
      { title: "A History of Violence", group: "DT · Dawntrail · Levels 94-95" },
      { title: "The Feat of Repast", group: "DT · Dawntrail · Levels 94-95" },
      { title: "A Father\u0027s Grief", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Taking a Stand", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Into the Traverse", group: "DT · Dawntrail · Levels 94-95" },
      { title: "City of Silence", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Blessed Siblings", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Scale of Trust", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Mamook Speaks", group: "DT · Dawntrail · Levels 94-95" },
      { title: "The Feat of the Brotherhood", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Road to the Golden City", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Dawn of a New Tomorrow", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Ever Greater, Ever Brighter", group: "DT · Dawntrail · Levels 94-95" },
      { title: "The Long Road to Xak Tural", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Saddled Up", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Braced for Trouble", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Blowing Smoke", group: "DT · Dawntrail · Levels 94-95" },
      { title: "Law of the Land", group: "DT · Dawntrail · Levels 94-95" },
      { title: "On Track", group: "DT · Dawntrail · Levels 94-95" },
      { title: "One with Nature", group: "DT · Dawntrail · Levels 96-97" },
      { title: "And the Land Would Tremble", group: "DT · Dawntrail · Levels 96-97" },
      { title: "No Time for Tears", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Pick up the Pieces", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Together as One", group: "DT · Dawntrail · Levels 96-97" },
      { title: "In Yyasulani\u0027s Shadow", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Putting Plans into Locomotion", group: "DT · Dawntrail · Levels 96-97" },
      { title: "A Hot Commodity", group: "DT · Dawntrail · Levels 96-97" },
      { title: "All Aboard", group: "DT · Dawntrail · Levels 96-97" },
      { title: "The Land of Levin", group: "DT · Dawntrail · Levels 96-97" },
      { title: "A Royal Welcome", group: "DT · Dawntrail · Levels 96-97" },
      { title: "A Day in the Life", group: "DT · Dawntrail · Levels 96-97" },
      { title: "On the Cloud", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Gone and Forgotten", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Embracing Oblivion", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Solution Nine", group: "DT · Dawntrail · Levels 96-97" },
      { title: "The Queen\u0027s Tour", group: "DT · Dawntrail · Levels 96-97" },
      { title: "Her People, Her Family", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Scales of Blue", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Gives You Teeth", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Little Footfalls", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Drowned Vestiges", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Memories of a Knight", group: "DT · Dawntrail · Levels 98-99" },
      { title: "At a Crossroads", group: "DT · Dawntrail · Levels 98-99" },
      { title: "The Protector and the Destroyer", group: "DT · Dawntrail · Levels 98-99" },
      { title: "A Comforting Hand", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Unto the Summit", group: "DT · Dawntrail · Levels 98-99" },
      { title: "The Resilient Son", group: "DT · Dawntrail · Levels 98-99" },
      { title: "A New Family", group: "DT · Dawntrail · Levels 98-99" },
      { title: "In Pursuit of Sphene", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Through the Gate of Gold", group: "DT · Dawntrail · Levels 98-99" },
      { title: "Those Who Live Forever", group: "DT · Dawntrail · Levels 98-99" },
      { title: "In Serenity and Sorrow", group: "DT · Dawntrail · Levels 98-99" },
      { title: "The Land of Dreams", group: "DT · Dawntrail · Levels 98-99" },
      { title: "A Knight of Alexandria", group: "DT · Dawntrail · Levels 98-99" },
      { title: "The Sanctuary of the Strong", group: "DT · Dawntrail · Level 100" },
      { title: "The Taste of Family", group: "DT · Dawntrail · Level 100" },
      { title: "Leafing through the Past", group: "DT · Dawntrail · Level 100" },
      { title: "An Explorer\u0027s Delight", group: "DT · Dawntrail · Level 100" },
      { title: "In Search of Discovery", group: "DT · Dawntrail · Level 100" },
      { title: "A Journey Never-ending", group: "DT · Dawntrail · Level 100" },
      { title: "Dawntrail", group: "DT · Dawntrail · Level 100" },
      { title: "A Royal Invitation", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "Alexandria Mourns", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "In Search of the Past", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "Among the Abandoned", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "Guidance of the Hhetso", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "The Warmth of Family", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "Crossroads", group: "DT · Post-Dawntrail · Patch 7.1" },
      { title: "A Glimmer of the Past", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "Memories of a Bygone Age", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "In Search of Meaning", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "A Jewel Shattered", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "The Meeting", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "Descent to the Foundation", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "Shared Paths", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "Seekers of Eternity", group: "DT · Post-Dawntrail · Patch 7.2" },
      { title: "Targeted Tragedy", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "The Endless Choice", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "My Memories and Yours", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "A Darkness in the Heart", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "Preservation Their Purpose", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "A Calculated Evolution", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "One of Our Own", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "A Terminal Invitation", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "Blades in Waiting", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "The Promise of Tomorrow", group: "DT · Post-Dawntrail · Patch 7.3" },
      { title: "With the Winds", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Through the Thunder", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Beyond the Mountains", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Around the City", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "To Work", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "In Her Heart", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Toward Trouble", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Where We Call Home", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "Into the Mist", group: "DT · Post-Dawntrail · Patch 7.4" },
      { title: "In Fate\u0027s Footsteps", group: "DT · Post-Dawntrail · Patch 7.5" },
      { title: "Two Worlds Entwined", group: "DT · Post-Dawntrail · Patch 7.5" },
      { title: "A Grave Presentiment", group: "DT · Post-Dawntrail · Patch 7.5" },
      { title: "A Beacon from Beyond", group: "DT · Post-Dawntrail · Patch 7.5" },
      { title: "Trail to the Heavens", group: "DT · Post-Dawntrail · Patch 7.5" },
      { title: "A Winter\u0027s Dream", group: "DT · Post-Dawntrail · Patch 7.56" },
      { title: "A Rush of Cold Wind", group: "DT · Post-Dawntrail · Patch 7.56" },
      { title: "The World Locked in Ice", group: "DT · Post-Dawntrail · Patch 7.56" },
      { title: "Windborne", group: "DT · Post-Dawntrail · Patch 7.56" }
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
     * Updates each group's completion indicator and collapses groups completed through quest checkboxes.
     */
    function updateExpandedGroupStatus() {
      document.querySelectorAll('#expandedView .expanded-group').forEach((group) => {
        const summary = group.querySelector('summary');
        if (!summary) return;

        const groupName = group.dataset.groupName || '';
        const complete = isExpandedGroupComplete(groupName);
        const questChecks = Array.from(group.querySelectorAll('.expanded-check'));
        const count = questChecks.length;
        const completedCount = questChecks.filter((checkbox) => checkbox.checked).length;
        const previousState = group.dataset.complete === 'true';
        const countLabel = summary.querySelector('.group-count');
        const status = summary.querySelector('.group-status');
        if (!countLabel || !status) return;

        countLabel.textContent = `${completedCount} / ${count}`;
        status.classList.toggle('complete', complete);
        status.title = complete ? 'Uncheck all quests in this group' : 'Complete all quests in this group';
        status.setAttribute('aria-label', `${complete ? 'Uncheck all quests in' : 'Complete all quests in'} ${groupName}`);
        status.setAttribute('aria-checked', String(complete));
        status.textContent = complete ? '✓' : '';

        group.dataset.complete = String(complete);
        group.classList.toggle('group-complete', complete);
        const keepOpenAfterStatusClick = group.dataset.keepOpenAfterStatusClick === 'true';
        delete group.dataset.keepOpenAfterStatusClick;

        if (complete && !previousState && !keepOpenAfterStatusClick) {
          const activeEl = document.activeElement;
          const previousScrollY = Number(group.dataset.scrollSnapshot || window.scrollY);
          if (activeEl instanceof HTMLElement) {
            activeEl.blur();
          }
          group.open = false;
          requestAnimationFrame(() => {
            window.scrollTo({ top: previousScrollY, left: 0, behavior: 'auto' });
          });
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

      if (!listEl.dataset.groupStatusControlsInitialized) {
        listEl.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const status = target.closest('.group-status[role="checkbox"]');
          if (!status) return;

          event.preventDefault();
          event.stopPropagation();

          const group = status.closest('.expanded-group');
          if (!group) return;

          const questChecks = Array.from(group.querySelectorAll('.expanded-check'));
          const shouldComplete = questChecks.some((checkbox) => !checkbox.checked);
          if (shouldComplete) {
            group.dataset.keepOpenAfterStatusClick = 'true';
          }
          questChecks.forEach((checkbox) => {
            checkbox.checked = shouldComplete;
          });
          saveState();
        });

        listEl.addEventListener('keydown', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement) || !target.matches('.group-status[role="checkbox"]')) return;
          if (event.key !== 'Enter' && event.key !== ' ') return;

          event.preventDefault();
          event.stopPropagation();
          target.click();
        });
        listEl.dataset.groupStatusControlsInitialized = 'true';
      }

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
        group.open = true;

        const summary = document.createElement('summary');
        summary.innerHTML = `
          <span class="group-title-wrap">
            <span class="group-label">${groupName}</span>
          </span>
          <span class="summary-meta">
            <span class="group-count">0 / ${items.length}</span>
            <span class="group-status" role="checkbox" tabindex="0" aria-checked="false" title="Complete all quests in this group"></span>
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
      const nextExpanded = Array.from(document.querySelectorAll('#expandedView .expanded-check')).find((item) => !item.checked);
      if (!nextExpanded) {
        nextStepEl.textContent = 'All expanded quests complete — time to revisit the best cutscenes.';
        return;
      }

      const row = nextExpanded.closest('.expanded-row');
      const label = row ? row.querySelector('.task-text')?.textContent.trim() : 'Next quest';
      nextStepEl.textContent = 'Next recommended step: ' + label;
    }

    function applyFilters() {
      // The expanded questbook is the only supported view.
    }

    function setMode(mode) {
      currentMode = 'expanded';
      if (expandedView) expandedView.classList.remove('is-hidden');
      applyFilters();
    }

    function refreshCheckRefs() {
      allChecks = Array.from(document.querySelectorAll('.expanded-check, .expanded-trailer-check'));
      storyChecks = Array.from(document.querySelectorAll('.expanded-check'));
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
        setMode('expanded');
        return;
      }

      try {
        const saved = JSON.parse(raw);
        const checks = saved && typeof saved === 'object' && Object.prototype.hasOwnProperty.call(saved, 'checks')
          ? saved.checks
          : saved;

        allChecks.forEach((item) => {
          if (item.dataset && item.dataset.id && Object.prototype.hasOwnProperty.call(checks, item.dataset.id)) {
            item.checked = Boolean(checks[item.dataset.id]);
          }
        });

        setMode('expanded');
      } catch (error) {
        console.warn('Failed to parse saved tracker state:', error);
        setMode('expanded');
      }
    }

    renderExpandedQuestBook();
    refreshCheckRefs();

    allChecks.forEach((item) => {
      item.addEventListener('pointerdown', () => {
        if (item.classList.contains('expanded-check')) {
          const group = item.closest('.expanded-group');
          if (group) {
            group.dataset.scrollSnapshot = String(window.scrollY);
          }
        }
      });

      item.addEventListener('change', () => {
        if (item.classList.contains('expanded-check')) {
          const group = item.closest('.expanded-group');
          if (group) {
            group.dataset.scrollSnapshot = String(window.scrollY);
          }
        }

        saveState();
      });
    });

    loadState();
    reorderCinematicRows();
    normalizeCinematicLabels();
    setMode(currentMode || 'expanded');
    updateProgress();
    updateUnlocks();
    updateNextStep();
    updateExpandedGroupStatus();
    applyFilters();
  