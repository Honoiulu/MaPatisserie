function getIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

let editingId = null;

function addDynamicField(containerId, value = '', placeholder = '') {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <input type="text" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" required />
    <button type="button" class="btn-remove" aria-label="Supprimer cette ligne">✕</button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => row.remove());
  container.appendChild(row);
  return row;
}

function escapeAttr(str) {
  return (str ?? '').replace(/"/g, '&quot;');
}

function collectList(containerId) {
  return Array.from(document.querySelectorAll(`#${containerId} input`))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

async function init() {
  editingId = getIdFromURL();

  document.getElementById('add-ingredient').addEventListener('click', () =>
    addDynamicField('ingredients-fields', '', 'ex : 150g beurre demi-sel')
  );
  document.getElementById('add-step').addEventListener('click', () =>
    addDynamicField('steps-fields', '', 'ex : Fondre le chocolat et le beurre au bain-marie.')
  );

  if (editingId) {
    const existing = await RecipeStorage.getRecipe(editingId);
    if (!existing) {
      alert('Recette introuvable.');
      window.location.href = 'index.html';
      return;
    }
    document.getElementById('page-title').textContent = 'Modifier la recette';
    document.getElementById('submit-btn').textContent = 'Enregistrer les modifications';
    const commentField = document.getElementById('comment-field');
    commentField.hidden = false;
    document.getElementById('comment').required = true;
    fillForm(existing.current);
  } else {
    document.getElementById('page-title').textContent = 'Nouvelle recette';
    addDynamicField('ingredients-fields', '', 'ex : 150g beurre demi-sel');
    addDynamicField('steps-fields', '', 'ex : Fondre le chocolat et le beurre au bain-marie.');
  }

  document.getElementById('recipe-form').addEventListener('submit', onSubmit);
  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.location.href = editingId ? `recette.html?id=${encodeURIComponent(editingId)}` : 'index.html';
  });
}

function fillForm(c) {
  document.getElementById('name').value = c.name;
  document.getElementById('category').value = c.category;
  document.getElementById('servings').value = c.servings;
  document.getElementById('prepTime').value = c.prepTime;
  document.getElementById('cookTime').value = c.cookTime;
  document.getElementById('temperature').value = c.temperature ?? '';
  document.getElementById('tips').value = c.tips || '';
  c.ingredients.forEach((i) => addDynamicField('ingredients-fields', i));
  c.steps.forEach((s) => addDynamicField('steps-fields', s));
}

async function onSubmit(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    servings: Number(document.getElementById('servings').value),
    prepTime: Number(document.getElementById('prepTime').value),
    cookTime: Number(document.getElementById('cookTime').value),
    temperature: document.getElementById('temperature').value
      ? Number(document.getElementById('temperature').value)
      : null,
    ingredients: collectList('ingredients-fields'),
    steps: collectList('steps-fields'),
    tips: document.getElementById('tips').value.trim()
  };

  if (data.ingredients.length === 0 || data.steps.length === 0) {
    alert('Ajoutez au moins un ingrédient et une étape.');
    return;
  }

  if (editingId) {
    const comment = document.getElementById('comment').value.trim();
    if (!comment) {
      alert("Merci d'indiquer la raison de cette modification : c'est ce qui alimente l'historique.");
      document.getElementById('comment').focus();
      return;
    }
    const updated = await RecipeStorage.updateRecipe(editingId, data, comment);
    window.location.href = `recette.html?id=${encodeURIComponent(updated.id)}`;
  } else {
    const created = await RecipeStorage.saveNewRecipe(data);
    window.location.href = `recette.html?id=${encodeURIComponent(created.id)}`;
  }
}

init();
