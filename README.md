# Mes Recettes de Pâtisserie

Un site statique (HTML/CSS/JS, sans backend) pour stocker et consulter vos
recettes de pâtisserie, avec historique des modifications. Conçu pour être
hébergé gratuitement sur **GitHub Pages**.

## Fonctionnalités

- **Liste des recettes** avec recherche et filtre par catégorie.
- **Page recette** : les ingrédients restent affichés en permanence (colonne
  collante) pendant que vous faites défiler les étapes.
- **Création / modification** via un formulaire, avec ajout/suppression
  dynamique d'ingrédients et d'étapes.
- **Historique des versions** : à chaque modification, vous devez indiquer
  la raison du changement. L'ancienne version est conservée et consultable
  à tout moment ; vous pouvez aussi la restaurer.
- **Export / Import JSON** pour sauvegarder votre bibliothèque ou la
  transférer d'un navigateur/appareil à l'autre.

## ⚠️ Comment fonctionne le stockage

GitHub Pages ne sert que des fichiers statiques : il n'y a pas de base de
données côté serveur. Vos recettes sont donc stockées dans le
**`localStorage`** de votre navigateur.

Concrètement :

- Au tout premier chargement, le site importe le contenu de
  `data/recipes-seed.json` (vos recettes de départ) dans le navigateur.
- Ensuite, **toute création, modification ou suppression reste dans ce
  navigateur** (elle n'est pas visible depuis un autre appareil, et elle
  disparaît si vous videz les données du site).
- Pour sauvegarder durablement ou synchroniser plusieurs appareils, utilisez
  le bouton **Exporter** (télécharge un fichier `.json`) et **Importer**
  (recharge ce fichier). Vous pouvez notamment :
  - garder ce fichier comme sauvegarde personnelle ;
  - remplacer `data/recipes-seed.json` par votre export et le committer sur
    GitHub, pour que ce jeu de recettes serve de point de départ partout où
    le site est ouvert.

Si un jour vous voulez une vraie synchronisation multi-appareils sans étape
manuelle, il faudra ajouter un service de stockage externe (par exemple une
base de données gratuite type Supabase/Firebase, ou committer sur GitHub via
son API avec un token) — ce n'est pas fait ici pour garder le site 100 %
statique et simple à héberger.

## Structure du projet

```
patisserie-recipes/
├── index.html          Liste des recettes
├── recette.html         Détail d'une recette + historique
├── edit.html            Création / modification d'une recette
├── css/
│   └── style.css        Styles (thème "carnet de pâtissier")
├── js/
│   ├── storage.js        Persistance (localStorage), versioning, export/import
│   ├── list.js            Logique de la page liste
│   ├── detail.js          Logique de la page détail + historique
│   └── form.js             Logique du formulaire de création/édition
├── data/
│   └── recipes-seed.json  Recettes de départ (chargées une seule fois)
└── README.md
```

## Modèle de données d'une recette

```json
{
  "id": "1769964809840",
  "createdAt": "2026-04-21T11:45:00.000Z",
  "current": {
    "name": "Brownie Ultime Noisettes et Chocolat Noir",
    "category": "Gâteaux",
    "servings": 8,
    "prepTime": 15,
    "cookTime": 24,
    "temperature": 170,
    "ingredients": ["200g chocolat de Pâques (moulages)", "..."],
    "steps": ["Fondre le chocolat de Pâques et le beurre au bain-marie.", "..."],
    "tips": "Le cacao en poudre non sucré compense l'apport massif de sucre...",
    "updatedAt": "2026-05-22T17:10:00.000Z"
  },
  "history": [
    {
      "version": 1,
      "changedAt": "2026-04-21T11:45:00.000Z",
      "comment": "Version initiale au chocolat noir 65%...",
      "snapshot": { "...": "l'intégralité de l'ancien 'current'" }
    }
  ]
}
```

- `current` contient toujours la version affichée par défaut.
- `history` contient les versions précédentes, chacune avec un commentaire
  expliquant pourquoi le changement a été fait.
- Le fichier `data/recipes-seed.json` fourni utilise déjà vos deux versions
  du brownie (chocolat noir 65% → chocolat de Pâques) comme exemple concret
  de cet historique.

## Déployer sur GitHub Pages

1. Créez un dépôt GitHub (par exemple `mes-recettes-patisserie`).
2. Placez tous les fichiers de ce dossier à la racine du dépôt (ou dans un
   sous-dossier `docs/`, au choix).
3. Sur GitHub : **Settings → Pages → Build and deployment → Source**,
   choisissez la branche (`main`) et le dossier (`/root` ou `/docs`).
4. Après quelques instants, votre site est disponible à
   `https://<votre-utilisateur>.github.io/<nom-du-depot>/`.

Aucune étape de build n'est nécessaire : c'est du HTML/CSS/JS pur.

## Développement local

Comme le site charge `data/recipes-seed.json` via `fetch`, ouvrir
`index.html` directement en double-cliquant (protocole `file://`) peut être
bloqué par le navigateur. Lancez plutôt un petit serveur local, par exemple :

```bash
cd patisserie-recipes
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```
