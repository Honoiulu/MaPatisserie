const state = { recipes: [], query: '', category: 'Toutes' };

async function init() {
  state.recipes = await RecipeStorage.loadRecipes();
  populateCategories();
  render();

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value.toLowerCase();
    render();
  });

  document.getElementById('category-filter').addEventListener('change', (e) => {
    state.category = e.target.value;
    render();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    RecipeStorage.exportAllToFile();
  });

  document.getElementById('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const merge = confirm(
      "Importer ces recettes.\n\nOK : fusionner avec les recettes existantes.\nAnnuler : remplacer entièrement la bibliothèque actuelle."
    );
    try {
      await RecipeStorage.importFromFile(file, merge ? 'merge' : 'replace');
      state.recipes = await RecipeStorage.loadRecipes();
      populateCategories();
      render();
    } catch (err) {
      alert(`Import impossible : ${err.message}`);
    } finally {
      e.target.value = '';
    }
  });
}

function populateCategories() {
  const select = document.getElementById('category-filter');
  const categories = Array.from(new Set(state.recipes.map((r) => r.current.category))).sort();
  select.innerHTML =
    '<option value="Toutes">Toutes les catégories</option>' +
    categories.map((c) => `<option value="${c}">${c}</option>`).join('');
}

function render() {
  const grid = document.getElementById('recipe-grid');
  const filtered = state.recipes.filter((r) => {
    const matchesQuery = r.current.name.toLowerCase().includes(state.query);
    const matchesCategory = state.category === 'Toutes' || r.current.category === state.category;
    return matchesQuery && matchesCategory;
  });

  if (state.recipes.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <p>Votre carnet est vide pour l'instant.</p>
      <a href="edit.html" class="btn-primary">Créer votre première recette</a>
    </div>`;
    return;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">Aucune recette ne correspond à cette recherche.</p>';
    return;
  }

  grid.innerHTML = filtered.map(cardTemplate).join('');
}

function cardTemplate(r) {
  const c = r.current;
  const totalTime = (Number(c.prepTime) || 0) + (Number(c.cookTime) || 0);
  const versionsCount = r.history.length;
  return `
    <a class="recipe-card" href="recette.html?id=${encodeURIComponent(r.id)}">
      <span class="recipe-card-tab">${escapeHtml(c.category)}</span>
      <h3>${escapeHtml(c.name)}</h3>
      <div class="recipe-card-meta">
        <span>${totalTime} min</span>
        <span>${c.servings} pers.</span>
        ${c.temperature ? `<span>${c.temperature}&nbsp;°C</span>` : ''}
      </div>
      ${versionsCount > 0 ? `<span class="recipe-card-versions">${versionsCount} révision${versionsCount > 1 ? 's' : ''}</span>` : ''}
    </a>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
