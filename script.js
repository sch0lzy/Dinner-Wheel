(function () {
  const THEME_STORAGE_KEY = 'dinnerWheelTheme';
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  });

  const STORAGE_KEY = 'dinnerWheelRecipes';
  const HIDDEN_STORAGE_KEY = 'dinnerWheelHiddenRecipes';
  const HISTORY_STORAGE_KEY = 'dinnerWheelSpinHistory';
  const HISTORY_LIMIT = 50;
  const WEEK_STORAGE_KEY = 'dinnerWheelThisWeek';
  const DONT_AGAIN_STORAGE_KEY = 'dinnerWheelDontMakeAgain';
  const CUISINE_STORAGE_KEY = 'dinnerWheelCuisines';
  const INGREDIENTS_STORAGE_KEY = 'dinnerWheelIngredients';
  const LIKED_STORAGE_KEY = 'dinnerWheelLikedRecipes';
  const RECIPES_COLLAPSED_KEY = 'dinnerWheelRecipesCollapsed';
  const CUISINE_OPTIONS = [
    'Unspecified', 'American', 'Italian', 'Mexican', 'Chinese', 'Japanese',
    'Thai', 'Indian', 'Mediterranean', 'French', 'Greek', 'Korean', 'Other',
  ];
  const COLORS = [
    '#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d',
    '#6d597a', '#eaac8b', '#457b9d', '#f28482', '#b5838d',
  ];

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const hubImage = new Image();
  let hubImageLoaded = false;
  hubImage.onload = () => {
    hubImageLoaded = true;
    drawWheel();
  };
  hubImage.src = 'IMG_2459.jpg';
  const spinBtn = document.getElementById('spinBtn');
  const quickWeekBtn = document.getElementById('quickWeekBtn');
  const resultEl = document.getElementById('result');
  const recipeForm = document.getElementById('recipeForm');
  const recipeInput = document.getElementById('recipeInput');
  const recipeListEl = document.getElementById('recipeList');
  const recipeCountEl = document.getElementById('recipeCount');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const importFile = document.getElementById('importFile');
  const importStatus = document.getElementById('importStatus');
  const hideRecipeBtn = document.getElementById('hideRecipeBtn');
  const toggleHiddenBtn = document.getElementById('toggleHiddenBtn');
  const hiddenList = document.getElementById('hiddenList');
  const hiddenCountEl = document.getElementById('hiddenCount');
  const addToWeekBtn = document.getElementById('addToWeekBtn');
  const weekList = document.getElementById('weekList');
  const weekCountEl = document.getElementById('weekCount');
  const clearWeekBtn = document.getElementById('clearWeekBtn');
  const groceryListBtn = document.getElementById('groceryListBtn');
  const groceryPanel = document.getElementById('groceryPanel');
  const groceryMissing = document.getElementById('groceryMissing');
  const groceryTextarea = document.getElementById('groceryTextarea');
  const copyGroceryBtn = document.getElementById('copyGroceryBtn');
  const downloadGroceryBtn = document.getElementById('downloadGroceryBtn');
  const recipesHeader = document.getElementById('recipesHeader');
  const recipesBody = document.getElementById('recipesBody');
  const toggleDontAgainBtn = document.getElementById('toggleDontAgainBtn');
  const dontAgainList = document.getElementById('dontAgainList');
  const dontAgainCountEl = document.getElementById('dontAgainCount');

  let recipes = loadRecipes();
  let hiddenRecipes = loadHidden();
  let spinHistory = loadHistory();
  let weekMeals = loadWeek();
  let dontAgainRecipes = loadDontAgain();
  let dontAgainPanelOpen = false;
  let recipeCuisines = loadCuisines();
  let recipeIngredients = loadIngredients();
  let likedRecipes = loadLiked();
  let currentRotation = 0;
  let spinning = false;
  let currentWinner = null;
  let hiddenPanelOpen = false;

  function loadRecipes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecipes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  }

  function loadHidden() {
    try {
      const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHidden() {
    localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenRecipes));
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(spinHistory));
  }

  function loadWeek() {
    try {
      const raw = localStorage.getItem(WEEK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveWeek() {
    localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(weekMeals));
  }

  function renderWeekList() {
    weekList.innerHTML = '';
    if (weekMeals.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No meals added yet.';
      weekList.appendChild(li);
    } else {
      weekMeals.forEach((name, idx) => {
        const li = document.createElement('li');

        const topRow = document.createElement('div');
        topRow.className = 'week-item-top';

        const span = document.createElement('span');
        span.className = 'recipe-name';
        span.textContent = likedRecipes.includes(name) ? `${name} \u2b50` : name;
        span.title = likedRecipes.includes(name) ? 'Click the star to unlike' : '';
        span.style.cursor = likedRecipes.includes(name) ? 'pointer' : '';
        span.addEventListener('click', () => {
          if (!likedRecipes.includes(name)) return;
          likedRecipes = likedRecipes.filter((n) => n !== name);
          saveLiked();
          span.textContent = name;
          span.title = '';
          span.style.cursor = '';
          likeBtn.disabled = false;
          noLikeBtn.disabled = false;
          li.classList.remove('reacted');
        });

        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.setAttribute('aria-label', `Remove ${name}`);
        btn.textContent = '✕';
        btn.addEventListener('click', () => {
          weekMeals.splice(idx, 1);
          saveWeek();
          renderWeekList();
        });

        topRow.appendChild(span);
        topRow.appendChild(btn);

        const reactions = document.createElement('div');
        reactions.className = 'reaction-buttons';

        const likeBtn = document.createElement('button');
        likeBtn.className = 'like-btn';
        likeBtn.textContent = 'Sausage Like';

        const noLikeBtn = document.createElement('button');
        noLikeBtn.className = 'no-like-btn';
        noLikeBtn.textContent = 'Sausage No Like';

        likeBtn.addEventListener('click', () => {
          likeBtn.disabled = true;
          noLikeBtn.disabled = true;
          li.classList.add('reacted');
          if (!likedRecipes.includes(name)) {
            likedRecipes.push(name);
            saveLiked();
          }
          span.textContent = `${name} \u2b50`;
        });

        noLikeBtn.addEventListener('click', () => {
          likeBtn.disabled = true;
          noLikeBtn.disabled = true;
          li.classList.add('reacted');
          addToDontAgain(name);
        });

        const hideBtn = document.createElement('button');
        hideBtn.className = 'hide-btn';
        hideBtn.textContent = 'Hide Recipe';
        hideBtn.addEventListener('click', () => {
          hideRecipe(name);
          weekMeals.splice(idx, 1);
          saveWeek();
          renderWeekList();
        });

        reactions.appendChild(likeBtn);
        reactions.appendChild(noLikeBtn);
        reactions.appendChild(hideBtn);

        li.appendChild(topRow);
        li.appendChild(reactions);
        weekList.appendChild(li);
      });
    }
    weekCountEl.textContent = `${weekMeals.length} meal${weekMeals.length === 1 ? '' : 's'}`;
  }

  function loadLiked() {
    try {
      const raw = localStorage.getItem(LIKED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLiked() {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedRecipes));
  }

  function loadDontAgain() {
    try {
      const raw = localStorage.getItem(DONT_AGAIN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDontAgain() {
    localStorage.setItem(DONT_AGAIN_STORAGE_KEY, JSON.stringify(dontAgainRecipes));
  }

  function renderDontAgainList() {
    dontAgainList.innerHTML = '';
    if (dontAgainRecipes.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No recipes here yet.';
      dontAgainList.appendChild(li);
    } else {
      dontAgainRecipes.forEach((name, idx) => {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.className = 'recipe-name';
        span.textContent = name;

        const btn = document.createElement('button');
        btn.className = 'restore-btn';
        btn.textContent = 'Restore';
        btn.addEventListener('click', () => {
          dontAgainRecipes.splice(idx, 1);
          if (!recipes.includes(name)) recipes.push(name);
          saveDontAgain();
          saveRecipes();
          renderDontAgainList();
          renderRecipeList();
        });

        li.appendChild(span);
        li.appendChild(btn);
        dontAgainList.appendChild(li);
      });
    }
    dontAgainCountEl.textContent = dontAgainRecipes.length;
  }

  function loadCuisines() {
    try {
      const raw = localStorage.getItem(CUISINE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCuisines() {
    localStorage.setItem(CUISINE_STORAGE_KEY, JSON.stringify(recipeCuisines));
  }

  function getCuisine(name) {
    return recipeCuisines[name] || 'Unspecified';
  }

  // Cuisines already eaten this week (ignoring 'Unspecified'), used to
  // steer the wheel away from repeating the same cuisine too often.
  function getWeekCuisines() {
    const set = new Set();
    weekMeals.forEach((name) => {
      const cuisine = getCuisine(name);
      if (cuisine !== 'Unspecified') set.add(cuisine);
    });
    return set;
  }

  function loadIngredients() {
    try {
      const raw = localStorage.getItem(INGREDIENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveIngredients() {
    localStorage.setItem(INGREDIENTS_STORAGE_KEY, JSON.stringify(recipeIngredients));
  }

  function addToDontAgain(name) {
    const idx = recipes.indexOf(name);
    if (idx !== -1) recipes.splice(idx, 1);
    if (!dontAgainRecipes.includes(name)) dontAgainRecipes.push(name);
    saveRecipes();
    saveDontAgain();
    renderRecipeList();
    renderDontAgainList();
  }

  function buildGroceryList() {
    const uniqueMeals = Array.from(new Set(weekMeals));
    // key: normalized ingredient text -> { text, recipes: Set<recipeName> }
    const groups = new Map();
    const missing = [];

    uniqueMeals.forEach((name) => {
      const ingredients = recipeIngredients[name];
      if (!ingredients || !ingredients.length) {
        missing.push(name);
        return;
      }
      ingredients.forEach((ingredient) => {
        const text = ingredient.trim();
        const key = text.toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, { text, recipes: new Set() });
        }
        groups.get(key).recipes.add(name);
      });
    });

    const items = Array.from(groups.values()).map((g) => g.text);
    const shared = Array.from(groups.values())
      .filter((g) => g.recipes.size > 1)
      .map((g) => ({ text: g.text, recipes: Array.from(g.recipes) }));

    return { items, missing, shared };
  }

  function showGroceryList() {
    const { items, missing, shared } = buildGroceryList();

    groceryTextarea.value = items.length
      ? items.join('\n')
      : 'No ingredient data available for this week\'s meals.';

    const notices = [];
    if (shared.length) {
      const sharedLines = shared
        .map((g) => `\u2022 ${g.text} \u2014 needed for ${g.recipes.length} recipes: ${g.recipes.join(', ')}`)
        .join('\n');
      notices.push(`Shared ingredients (buy extra):\n${sharedLines}`);
    }
    if (missing.length) {
      notices.push(`No ingredient data for: ${missing.join(', ')} (re-import from AnyList to add ingredients, or type them manually above).`);
    }
    groceryMissing.textContent = notices.join('\n\n');

    groceryPanel.hidden = false;
  }

  function addToWeek(name) {
    weekMeals.push(name);
    saveWeek();
    renderWeekList();
    addToWeekBtn.disabled = true;
    addToWeekBtn.textContent = 'Added ✓';
  }

  function recordSpin(name) {
    spinHistory.push(name);
    if (spinHistory.length > HISTORY_LIMIT) {
      spinHistory = spinHistory.slice(-HISTORY_LIMIT);
    }
    saveHistory();
  }

  // Returns the list of recipes eligible to be picked, excluding any that
  // were selected within the last HISTORY_LIMIT spins. If that would leave
  // no eligible recipes (e.g. small recipe list), the exclusion window is
  // shrunk just enough to guarantee at least one eligible recipe.
  function getEligibleRecipes() {
    let windowSize = Math.min(HISTORY_LIMIT, Math.max(recipes.length - 1, 0));
    let pool = recipes.slice();
    while (windowSize > 0) {
      const recent = new Set(spinHistory.slice(-windowSize));
      const eligible = recipes.filter((r) => !recent.has(r));
      if (eligible.length > 0) {
        pool = eligible;
        break;
      }
      windowSize--;
    }

    // Further steer away from cuisines already eaten this week, but only
    // if that leaves at least one option; otherwise ignore the constraint.
    const weekCuisines = getWeekCuisines();
    if (weekCuisines.size > 0) {
      const cuisineFiltered = pool.filter((r) => !weekCuisines.has(getCuisine(r)));
      if (cuisineFiltered.length > 0) return cuisineFiltered;
    }

    return pool;
  }

  function renderRecipeList() {
    recipeListEl.innerHTML = '';
    if (recipes.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No recipes yet. Add one above!';
      recipeListEl.appendChild(li);
    } else {
      recipes.forEach((name, idx) => {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.className = 'recipe-name';
        span.textContent = name;

        const cuisineSelect = document.createElement('select');
        cuisineSelect.className = 'cuisine-select';
        cuisineSelect.setAttribute('aria-label', `Cuisine for ${name}`);
        CUISINE_OPTIONS.forEach((opt) => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.textContent = opt;
          cuisineSelect.appendChild(optionEl);
        });
        cuisineSelect.value = getCuisine(name);
        cuisineSelect.addEventListener('change', () => {
          recipeCuisines[name] = cuisineSelect.value;
          saveCuisines();
        });

        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.setAttribute('aria-label', `Remove ${name}`);
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeRecipe(idx));

        li.appendChild(span);
        li.appendChild(cuisineSelect);
        li.appendChild(btn);
        recipeListEl.appendChild(li);
      });
    }
    recipeCountEl.textContent = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`;
    spinBtn.disabled = recipes.length < 2;
    quickWeekBtn.disabled = recipes.length < 2;
    drawWheel();
  }

  function renderHiddenList() {
    hiddenList.innerHTML = '';
    if (hiddenRecipes.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No hidden recipes.';
      hiddenList.appendChild(li);
    } else {
      hiddenRecipes.forEach((name, idx) => {
        const li = document.createElement('li');

        const span = document.createElement('span');
        span.className = 'recipe-name';
        span.textContent = name;

        const btn = document.createElement('button');
        btn.className = 'restore-btn';
        btn.textContent = 'Restore';
        btn.addEventListener('click', () => restoreRecipe(idx));

        li.appendChild(span);
        li.appendChild(btn);
        hiddenList.appendChild(li);
      });
    }
    hiddenCountEl.textContent = hiddenRecipes.length;
  }

  function hideRecipe(name) {
    const idx = recipes.findIndex((r) => r === name);
    if (idx === -1) return;
    recipes.splice(idx, 1);
    hiddenRecipes.push(name);
    saveRecipes();
    saveHidden();
    renderRecipeList();
    renderHiddenList();
    drawWheel();
    if (currentWinner === name) {
      hideRecipeBtn.hidden = true;
      addToWeekBtn.hidden = true;
      currentWinner = null;
    }
    resultEl.textContent = `"${name}" hidden. It won't show up on the wheel.`;
  }

  function restoreRecipe(idx) {
    const [name] = hiddenRecipes.splice(idx, 1);
    if (name === undefined) return;
    recipes.push(name);
    saveRecipes();
    saveHidden();
    renderRecipeList();
    renderHiddenList();
  }

  function addRecipe(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    recipes.push(trimmed);
    saveRecipes();
    renderRecipeList();
  }

  function removeRecipe(idx) {
    recipes.splice(idx, 1);
    saveRecipes();
    renderRecipeList();
  }

  function clearAll() {
    if (recipes.length === 0) return;
    if (!confirm('Remove all recipes?')) return;
    recipes = [];
    saveRecipes();
    renderRecipeList();
  }

  function drawWheel() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 4;

    ctx.clearRect(0, 0, w, h);

    if (recipes.length === 0) {
      ctx.fillStyle = '#f0e6dc';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a08d7d';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add recipes to begin', cx, cy);
      return;
    }

    const segAngle = (Math.PI * 2) / recipes.length;

    recipes.forEach((name, i) => {
      // angle 0 = top, increasing clockwise. Canvas 0deg is at 3 o'clock,
      // so we offset by -90deg (-PI/2).
      const startAngle = i * segAngle - Math.PI / 2;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = '600 15px sans-serif';
      const maxWidth = radius - 24;
      let label = name;
      while (ctx.measureText(label).width > maxWidth && label.length > 3) {
        label = label.slice(0, -2) + '…';
      }
      ctx.fillText(label, radius - 12, 0);
      ctx.restore();
    });

    // Center hub image
    const hubRadius = radius * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    if (hubImageLoaded) {
      ctx.clip();
      const iw = hubImage.naturalWidth;
      const ih = hubImage.naturalHeight;
      const scale = Math.max((hubRadius * 2) / iw, (hubRadius * 2) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(hubImage, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Runs the wheel-spin animation, picks an eligible winner, records it in
  // spin history, and resolves with the winner's name once the animation
  // finishes. Does not touch any result/action button UI.
  function performSpin(excludeNames) {
    const eligibleBase = getEligibleRecipes();
    const eligible = excludeNames && excludeNames.size
      ? eligibleBase.filter((r) => !excludeNames.has(r))
      : eligibleBase;
    const pool = eligible.length ? eligible : eligibleBase;

    const winnerName = pool[Math.floor(Math.random() * pool.length)];
    const winnerIndex = recipes.indexOf(winnerName);

    const segAngle = 360 / recipes.length;
    // Random point within the winning segment (avoid exact edges).
    const jitter = (Math.random() * 0.7 + 0.15) * segAngle;
    const winnerAngle = winnerIndex * segAngle + jitter; // angle from top, clockwise

    const targetMod = ((360 - winnerAngle) % 360 + 360) % 360;
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const delta = ((targetMod - currentMod) + 360) % 360;

    currentRotation += extraSpins * 360 + delta;

    canvas.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    canvas.style.transform = `rotate(${currentRotation}deg)`;

    return new Promise((resolve) => {
      setTimeout(() => {
        recordSpin(winnerName);
        resolve(winnerName);
      }, 4100);
    });
  }

  async function spin() {
    if (spinning || recipes.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    quickWeekBtn.disabled = true;
    resultEl.textContent = '';
    hideRecipeBtn.hidden = true;
    addToWeekBtn.hidden = true;
    currentWinner = null;

    const winnerName = await performSpin();

    spinning = false;
    spinBtn.disabled = recipes.length < 2;
    quickWeekBtn.disabled = recipes.length < 2;
    currentWinner = winnerName;
    resultEl.textContent = `🍴 Tonight's dinner: ${winnerName}`;
    hideRecipeBtn.hidden = false;
    addToWeekBtn.hidden = false;
    addToWeekBtn.disabled = false;
    addToWeekBtn.textContent = "Add to This Week's Meals";
  }

  async function quickWeek() {
    if (spinning || recipes.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    quickWeekBtn.disabled = true;
    hideRecipeBtn.hidden = true;
    addToWeekBtn.hidden = true;
    currentWinner = null;

    const count = 7;
    const picked = [];
    const pickedThisBatch = new Set();

    for (let i = 0; i < count; i++) {
      resultEl.textContent = `Spinning ${i + 1}/${count}...`;
      const winnerName = await performSpin(pickedThisBatch);
      pickedThisBatch.add(winnerName);
      addToWeek(winnerName);
      picked.push(winnerName);
    }

    spinning = false;
    spinBtn.disabled = recipes.length < 2;
    quickWeekBtn.disabled = recipes.length < 2;
    resultEl.textContent = `🍴 Added ${picked.length} recipe${picked.length === 1 ? '' : 's'} to this week!`;
  }

  function showImportStatus(message, isError) {
    importStatus.textContent = message;
    importStatus.classList.toggle('error', !!isError);
  }

  function extractRecipeEntries(data) {
    if (!Array.isArray(data)) return null;
    const entries = data
      .map((item) => {
        if (typeof item === 'string') {
          const name = item.trim();
          return name ? { name, ingredients: null } : null;
        }
        if (item && typeof item === 'object' && typeof item.name === 'string') {
          const name = item.name.trim();
          if (!name) return null;
          const ingredients = Array.isArray(item.ingredients)
            ? item.ingredients.map((i) => String(i).trim()).filter(Boolean)
            : null;
          return { name, ingredients };
        }
        return null;
      })
      .filter(Boolean);
    return entries.length ? entries : null;
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch (e) {
        showImportStatus('Import failed: file is not valid JSON.', true);
        return;
      }
      const entries = extractRecipeEntries(data);
      if (!entries) {
        showImportStatus('Import failed: expected a JSON array of recipe names or objects with a "name" field.', true);
        return;
      }
      const existing = new Set(recipes.map((r) => r.toLowerCase()));
      let added = 0;
      entries.forEach(({ name, ingredients }) => {
        if (!existing.has(name.toLowerCase())) {
          recipes.push(name);
          existing.add(name.toLowerCase());
          added += 1;
        }
        if (ingredients && ingredients.length) {
          recipeIngredients[name] = ingredients;
        }
      });
      saveRecipes();
      saveIngredients();
      renderRecipeList();
      const skipped = entries.length - added;
      showImportStatus(
        `Imported ${added} recipe${added === 1 ? '' : 's'}${skipped ? ` (${skipped} duplicate${skipped === 1 ? '' : 's'} skipped)` : ''}.`,
        false
      );
    };
    reader.onerror = () => showImportStatus('Import failed: could not read file.', true);
    reader.readAsText(file);
  }

  importFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    handleImportFile(file);
    importFile.value = '';
  });

  recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addRecipe(recipeInput.value);
    recipeInput.value = '';
    recipeInput.focus();
  });

  clearAllBtn.addEventListener('click', clearAll);
  spinBtn.addEventListener('click', spin);
  quickWeekBtn.addEventListener('click', quickWeek);

  hideRecipeBtn.addEventListener('click', () => {
    if (currentWinner) hideRecipe(currentWinner);
  });

  toggleHiddenBtn.addEventListener('click', () => {
    hiddenPanelOpen = !hiddenPanelOpen;
    hiddenList.hidden = !hiddenPanelOpen;
  });

  addToWeekBtn.addEventListener('click', () => {
    if (currentWinner) addToWeek(currentWinner);
  });

  clearWeekBtn.addEventListener('click', () => {
    if (weekMeals.length === 0) return;
    if (!confirm("Clear this week's meals?")) return;
    weekMeals = [];
    saveWeek();
    renderWeekList();
  });

  const recipesCollapsed = localStorage.getItem(RECIPES_COLLAPSED_KEY) === 'true';
  recipesBody.hidden = recipesCollapsed;
  recipesHeader.classList.toggle('collapsed', recipesCollapsed);

  recipesHeader.addEventListener('click', () => {
    const collapsed = recipesBody.hidden;
    recipesBody.hidden = !collapsed;
    recipesHeader.classList.toggle('collapsed', !collapsed);
    localStorage.setItem(RECIPES_COLLAPSED_KEY, String(!collapsed));
  });

  groceryListBtn.addEventListener('click', () => {
    if (groceryPanel.hidden) {
      showGroceryList();
    } else {
      groceryPanel.hidden = true;
    }
  });

  copyGroceryBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(groceryTextarea.value);
      copyGroceryBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyGroceryBtn.textContent = 'Copy to Clipboard'; }, 1500);
    } catch (e) {
      groceryTextarea.select();
    }
  });

  downloadGroceryBtn.addEventListener('click', () => {
    const items = groceryTextarea.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  toggleDontAgainBtn.addEventListener('click', () => {
    dontAgainPanelOpen = !dontAgainPanelOpen;
    dontAgainList.hidden = !dontAgainPanelOpen;
  });

  renderRecipeList();
  renderHiddenList();
  renderWeekList();
  renderDontAgainList();
})();
