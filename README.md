# NutriTrack - Application de suivi nutritionnel

NutriTrack est une application complète de suivi nutritionnel qui permet aux utilisateurs de suivre leurs apports alimentaires, définir des objectifs nutritionnels et analyser leurs habitudes alimentaires à l'aide de graphiques interactifs et de statistiques.

## Dernières fonctionnalités implémentées (Avril 2025)

### 1. Authentification et Sécurité
- Système d'**authentification complet** avec inscription et connexion
- **Gestion des sessions utilisateurs** via JWT (JSON Web Tokens)
- Stockage sécurisé des mots de passe avec **hachage via bcrypt**
- **Protection des routes API** avec middleware d'authentification
- **Déconnexion sécurisée** avec invalidation des tokens

### 2. Gestion de Profil Utilisateur
- **Page de profil complète** avec informations personnelles et préférences
- **Upload de photo de profil** avec recadrage et redimensionnement
- Fonctionnalité de **changement de mot de passe** sécurisée
- **Personnalisation des objectifs nutritionnels** (calories, macronutriments)
- Paramètres thématiques avec **option de mode sombre**
- **Affichage cohérent** des informations utilisateur dans l'ensemble de l'application

## Fonctionnalités

### Frontend (Vanilla JS)
- **Dashboard interactif** avec résumé des apports journaliers et progression des objectifs
- **Gestion des repas** avec formulaire d'ajout et de modification
- **Objectifs nutritionnels** personnalisables
- **Visualisation des données** avec graphiques dynamiques
- **Statistiques** sur les habitudes alimentaires
- **Recommandations** basées sur les objectifs nutritionnels
- **Exportation des données** en formats JSON et CSV
- **Interface responsive** avec Bootstrap 5

### Backend (Node.js / Express)
- **API RESTful** bien structurée
- **Authentification** par token JWT
- **Base de données JSON** pour la persistance des données
- **Opérations CRUD** complètes pour les repas et objectifs
- **Calculs nutritionnels** avec principes de programmation fonctionnelle

## Architecture technique

L'application est construite en suivant les principes de la programmation fonctionnelle :

- **Fonctions pures** pour la logique métier (calculs, filtrage)
- **Immutabilité** des objets et états (via `Object.freeze`)
- Utilisation intensive de **fonctions d'ordre supérieur** (`map`, `filter`, `reduce`)
- **Composition de fonctions** pour des opérations complexes
- **Séparation stricte** entre les fonctions pures et les effets de bord

## Structure du projet

```
NutriTrack/
├── backend/             # API backend
│   ├── data/            # Stockage des données JSON
│   └── src/
│       ├── controllers/ # Contrôleurs pour les routes API
│       ├── middlewares/ # Middlewares (auth, error handling)
│       ├── models/      # Modèles de données
│       ├── routes/      # Routes API
│       ├── services/    # Services métier
│       ├── utils/       # Utilitaires et fonctions pures
│       └── server.js    # Point d'entrée du serveur
│
└── frontend/            # Interface utilisateur
    ├── css/             # Styles CSS
    ├── js/              # Scripts JavaScript
    │   ├── api.js       # Service API 
    │   ├── auth.js      # Gestion de l'authentification
    │   ├── utils.js     # Fonctions utilitaires
    │   ├── app.js       # Module principal et routage
    │   ├── dashboard.js # Module tableau de bord
    │   ├── meals.js     # Module de gestion des repas
    │   ├── goals.js     # Module de gestion des objectifs
    │   ├── stats.js     # Module de statistiques
    │   └── profile.js   # Module de gestion du profil
    └── index.html       # Page HTML principale
```

## Installation et démarrage

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/nutritrack.git
cd nutritrack
```

2. Installer les dépendances du backend :
```bash
cd backend
npm install
```

3. Démarrer le serveur backend :
```bash
npm run dev
```

4. Ouvrir le frontend dans un navigateur :
- Ouvrez `frontend/index.html` dans votre navigateur préféré
- Ou utilisez un serveur local comme Live Server (VSCode)

## Concepts fonctionnels utilisés

### Immutabilité
```javascript
// Utilisation d'Object.freeze pour créer des objets immutables
const meal = Object.freeze({
  id: uuid(),
  name: 'Salade de poulet',
  calories: 350
});
```

### Fonctions pures
```javascript
// Fonction pure pour calculer les totaux nutritionnels
const calculateTotals = (meals) => meals.reduce(
  (acc, meal) => ({
    calories: acc.calories + meal.calories,
    proteins: acc.proteins + meal.proteins,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats
  }),
  { calories: 0, proteins: 0, carbs: 0, fats: 0 }
);
```

### Composition de fonctions
```javascript
// Composition de fonctions pour filtrer et transformer des données
const getProteinRichMeals = R.pipe(
  R.filter(meal => meal.proteins > 20),
  R.sortBy(R.prop('proteins')),
  R.reverse,
  R.take(3)
);
```

## Licence
MIT
