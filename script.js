(function () {
  const STORAGE_KEY = 'dinnerWheelRecipes';
  const COLORS = [
    '#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d',
    '#6d597a', '#eaac8b', '#457b9d', '#f28482', '#b5838d',
  ];

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('result');
  const recipeForm = document.getElementById('recipeForm');
  const recipeInput = document.getElementById('recipeInput');
  const recipeListEl = document.getElementById('recipeList');
  const recipeCountEl = document.getElementById('recipeCount');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const importFile = document.getElementById('importFile');
  const importStatus = document.getElementById('importStatus');

  let recipes = loadRecipes();
  let currentRotation = 0;
  let spinning = false;

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

        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.setAttribute('aria-label', `Remove ${name}`);
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeRecipe(idx));

        li.appendChild(span);
        li.appendChild(btn);
        recipeListEl.appendChild(li);
      });
    }
    recipeCountEl.textContent = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`;
    spinBtn.disabled = recipes.length < 2;
    drawWheel();
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
  }

  function spin() {
    if (spinning || recipes.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = '';

    const segAngle = 360 / recipes.length;
    const winnerIndex = Math.floor(Math.random() * recipes.length);
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

    setTimeout(() => {
      spinning = false;
      spinBtn.disabled = recipes.length < 2;
      resultEl.textContent = `🍴 Tonight's dinner: ${recipes[winnerIndex]}`;
    }, 4100);
  }

  function showImportStatus(message, isError) {
    importStatus.textContent = message;
    importStatus.classList.toggle('error', !!isError);
  }

  function extractNames(data) {
    if (!Array.isArray(data)) return null;
    const names = data
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object' && typeof item.name === 'string') {
          return item.name.trim();
        }
        return null;
      })
      .filter(Boolean);
    return names.length ? names : null;
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
      const names = extractNames(data);
      if (!names) {
        showImportStatus('Import failed: expected a JSON array of recipe names or objects with a "name" field.', true);
        return;
      }
      const existing = new Set(recipes.map((r) => r.toLowerCase()));
      let added = 0;
      names.forEach((name) => {
        if (!existing.has(name.toLowerCase())) {
          recipes.push(name);
          existing.add(name.toLowerCase());
          added += 1;
        }
      });
      saveRecipes();
      renderRecipeList();
      const skipped = names.length - added;
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

  renderRecipeList();
})();
