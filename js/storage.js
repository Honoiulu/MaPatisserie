/**
 * storage.js
 * Couche de persistance des recettes.
 *
 * Modèle de données d'une recette :
 * {
 *   id: string,
 *   createdAt: ISOString,
 *   current: { name, category, servings, prepTime, cookTime, temperature,
 *              ingredients: string[], steps: string[], tips, updatedAt },
 *   history: [
 *     { version: number, changedAt: ISOString, comment: string, snapshot: <ancien "current"> }
 *   ]
 * }
 *
 * Stockage : localStorage (par navigateur). Le fichier data/recipes-seed.json
 * sert uniquement de contenu initial, chargé une seule fois si le
 * localStorage est vide. Ensuite, toute modification vit dans le navigateur.
 * Utilisez Exporter / Importer pour sauvegarder ou faire passer vos
 * recettes d'un navigateur/appareil à l'autre.
 */

const STORAGE_KEY = 'patisserie:recipes:v1';
const SEED_URL = 'data/recipes-seed.json';

function nowISO() {
  return new Date().toISOString();
}

function generateId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function readRaw() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function writeRaw(recipes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

async function ensureSeeded() {
  let recipes = readRaw();
  if (recipes === null) {
    try {
      const res = await fetch(SEED_URL);
      recipes = res.ok ? await res.json() : [];
    } catch (e) {
      recipes = [];
    }
    writeRaw(recipes);
  }
  return recipes;
}

/** Charge toutes les recettes (initialise depuis le seed si premier lancement). */
async function loadRecipes() {
  return ensureSeeded();
}

/** Récupère une recette par id, ou null. */
async function getRecipe(id) {
  const recipes = await loadRecipes();
  return recipes.find((r) => r.id === id) || null;
}

/** Crée une nouvelle recette. Retourne la recette créée. */
async function saveNewRecipe(data) {
  const recipes = await loadRecipes();
  const timestamp = nowISO();
  const recipe = {
    id: generateId(),
    createdAt: timestamp,
    current: { ...data, updatedAt: timestamp },
    history: []
  };
  recipes.unshift(recipe);
  writeRaw(recipes);
  return recipe;
}

/**
 * Met à jour une recette existante : l'ancienne version "current" part
 * dans l'historique avec le commentaire fourni, et "current" devient
 * les nouvelles données.
 */
async function updateRecipe(id, newData, comment) {
  const recipes = await loadRecipes();
  const idx = recipes.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Recette introuvable');
  const recipe = recipes[idx];

  recipe.history.push({
    version: recipe.history.length + 1,
    changedAt: recipe.current.updatedAt || recipe.createdAt,
    comment: comment && comment.trim() ? comment.trim() : 'Modification sans commentaire',
    snapshot: recipe.current
  });

  recipe.current = { ...newData, updatedAt: nowISO() };
  recipes[idx] = recipe;
  writeRaw(recipes);
  return recipe;
}

/**
 * Restaure une ancienne version comme version actuelle. La version
 * actuelle au moment de la restauration est elle-même archivée.
 */
async function restoreVersion(id, historyIndex, comment) {
  const recipes = await loadRecipes();
  const idx = recipes.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Recette introuvable');
  const recipe = recipes[idx];
  const target = recipe.history[historyIndex];
  if (!target) throw new Error('Version introuvable');

  const defaultComment = `Restauration de la version du ${new Date(target.changedAt).toLocaleDateString('fr-FR')}`;
  recipe.history.push({
    version: recipe.history.length + 1,
    changedAt: recipe.current.updatedAt || recipe.createdAt,
    comment: comment && comment.trim() ? comment.trim() : defaultComment,
    snapshot: recipe.current
  });

  recipe.current = { ...target.snapshot, updatedAt: nowISO() };
  recipes[idx] = recipe;
  writeRaw(recipes);
  return recipe;
}

/** Supprime définitivement une recette (et son historique). */
async function deleteRecipe(id) {
  const recipes = await loadRecipes();
  writeRaw(recipes.filter((r) => r.id !== id));
}

/** Télécharge toutes les recettes sous forme de fichier JSON. */
async function exportAllToFile() {
  const recipes = await loadRecipes();
  const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recettes-patisserie-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Importe un fichier JSON (tableau de recettes, même format que l'export).
 * mode 'merge'   : ajoute/écrase par id, conserve le reste.
 * mode 'replace' : remplace entièrement les recettes existantes.
 */
async function importFromFile(file, mode = 'merge') {
  const text = await file.text();
  const imported = JSON.parse(text);
  if (!Array.isArray(imported)) {
    throw new Error('Format JSON invalide : un tableau de recettes est attendu.');
  }
  let recipes = mode === 'replace' ? [] : await loadRecipes();
  imported.forEach((imp) => {
    const existingIdx = recipes.findIndex((r) => r.id === imp.id);
    if (existingIdx >= 0) {
      recipes[existingIdx] = imp;
    } else {
      recipes.push(imp);
    }
  });
  writeRaw(recipes);
  return recipes;
}

window.RecipeStorage = {
  loadRecipes,
  getRecipe,
  saveNewRecipe,
  updateRecipe,
  restoreVersion,
  deleteRecipe,
  exportAllToFile,
  importFromFile
};
