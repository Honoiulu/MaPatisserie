function getIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

let recipe = null;

async function init() {
  const id = getIdFromURL();
  recipe = id ? await RecipeStorage.getRecipe(id) : null;

  if (!recipe) {
    document.getElementById('app').innerHTML =
      '<p class="empty-state">Recette introuvable. <a href="index.html">Retour à la liste</a></p>';
    document.getElementById('page-actions').hidden = true;
    return;
  }

  render();

  document.getElementById('edit-btn').href = `edit.html?id=${encodeURIComponent(recipe.id)}`;
  document.getElementById('delete-btn').addEventListener('click', onDelete);
  document.getElementById('history-toggle').addEventListener('click', toggleHistory);
  document.getElementById('snapshot-close').addEventListener('click', closeSnapshot);
  document.getElementById('snapshot-modal').addEventListener('click', (e) => {
    if (e.target.id === 'snapshot-modal') closeSnapshot();
  });
}

function render() {
  const c = recipe.current;
  document.title = `${c.name} — Mes Recettes`;
  document.getElementById('recipe-name').textContent = c.name;
  document.getElementById('recipe-category').textContent = c.category;
  document.getElementById('meta-servings').textContent = `${c.servings} personnes`;
  document.getElementById('meta-prep').textContent = `${c.prepTime} min`;
  document.getElementById('meta-cook').textContent = `${c.cookTime} min`;
  document.getElementById('meta-temp').textContent = c.temperature ? `${c.temperature} °C` : '—';

  document.getElementById('ingredients-list').innerHTML = c.ingredients
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join('');

  document.getElementById('steps-list').innerHTML = c.steps
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

  const tipsSection = document.getElementById('tips-section');
  if (c.tips) {
    tipsSection.hidden = false;
    document.getElementById('tips-text').textContent = c.tips;
  } else {
    tipsSection.hidden = true;
  }

  document.getElementById('updated-at').textContent = new Date(c.updatedAt).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  document.getElementById('history-count').textContent = recipe.history.length;

  if (recipe.history.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune modification enregistrée pour cette recette.</p>';
    return;
  }

  container.innerHTML = recipe.history
    .map((h, index) => ({ h, index }))
    .reverse()
    .map(
      ({ h, index }) => `
      <div class="history-entry">
        <div class="history-entry-marker">v${h.version}</div>
        <div class="history-entry-body">
          <div class="history-entry-date">${new Date(h.changedAt).toLocaleString('fr-FR', {
            dateStyle: 'long',
            timeStyle: 'short'
          })}</div>
          <p class="history-comment">&laquo;&nbsp;${escapeHtml(h.comment)}&nbsp;&raquo;</p>
          <div class="history-actions">
            <button type="button" class="btn-secondary" data-action="view" data-index="${index}">Voir cette version</button>
            <button type="button" class="btn-secondary" data-action="restore" data-index="${index}">Restaurer</button>
          </div>
        </div>
      </div>`
    )
    .join('');

  container.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener('click', () => viewSnapshot(Number(btn.dataset.index)));
  });
  container.querySelectorAll('[data-action="restore"]').forEach((btn) => {
    btn.addEventListener('click', () => onRestore(Number(btn.dataset.index)));
  });
}

function toggleHistory() {
  const panel = document.getElementById('history-panel');
  panel.hidden = !panel.hidden;
  document.getElementById('history-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function viewSnapshot(index) {
  const entry = recipe.history[index];
  const snap = entry.snapshot;
  document.getElementById('snapshot-title').textContent =
    `${snap.name} — version du ${new Date(entry.changedAt).toLocaleDateString('fr-FR')}`;
  document.getElementById('snapshot-comment').textContent = entry.comment;
  document.getElementById('snapshot-ingredients').innerHTML = snap.ingredients
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join('');
  document.getElementById('snapshot-steps').innerHTML = snap.steps
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');
  const tipsEl = document.getElementById('snapshot-tips');
  tipsEl.textContent = snap.tips || 'Aucune astuce notée pour cette version.';
  document.getElementById('snapshot-modal').hidden = false;
}

function closeSnapshot() {
  document.getElementById('snapshot-modal').hidden = true;
}

async function onRestore(index) {
  const target = recipe.history[index];
  const ok = confirm(
    `Restaurer la version du ${new Date(target.changedAt).toLocaleDateString('fr-FR')} ?\n\nLa version actuelle sera conservée dans l'historique.`
  );
  if (!ok) return;
  const comment = prompt('Commentaire pour cette restauration (optionnel) :', '') || '';
  recipe = await RecipeStorage.restoreVersion(recipe.id, index, comment);
  closeSnapshot();
  render();
}

async function onDelete() {
  const ok = confirm(`Supprimer définitivement "${recipe.current.name}" ainsi que tout son historique ?`);
  if (!ok) return;
  await RecipeStorage.deleteRecipe(recipe.id);
  window.location.href = 'index.html';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
