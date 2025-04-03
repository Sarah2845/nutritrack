# NutriTrack - Application de suivi nutritionnel

NutriTrack est une application complète de suivi nutritionnel qui permet aux utilisateurs de suivre leurs apports alimentaires, définir des objectifs nutritionnels et analyser leurs habitudes alimentaires à l'aide de graphiques interactifs et de statistiques.

## 📥 Installation et exécution

### Option 1 : Exécution locale (Node.js)

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-utilisateur/nutritrack.git
cd nutritrack
```

2. Installer les dépendances :
```bash
npm install
```

3. Démarrer le serveur local :
```bash
npm start
```

4. Accéder à l'application : http://localhost:3001

### Option 2 : Utiliser Docker (recommandé pour les tests)

1. Avec Docker Compose :
```bash
docker-compose up -d
```

2. Ou avec Docker directement :
```bash
docker build -t nutritrack .
docker run -p 3001:3001 nutritrack
```

3. Accéder à l'application : http://localhost:3001

## 🔥 Dernières améliorations (Avril 2025)

### 1. Système de recommandations alimentaires 🍎
- **Recommandations personnalisées** basées sur les objectifs nutritionnels
- **Génération intelligente** d'alternatives en cas d'erreur de chargement
- **Mise en cache côté client** pour améliorer la réactivité
- **Gestion robuste des erreurs** pour une expérience utilisateur fluide

### 2. Interface utilisateur améliorée 💻
- **Navigation unifiée** entre toutes les sections
- **Système de notification** intégré pour une meilleure communication
- **Indicateurs de progression** visuels pour le suivi des objectifs
- **Mise en page responsive** pour tous les appareils

### 3. Architecture optimisée ⚙️
- **Accès direct à la base de données** avec lowdb pour des performances améliorées
- **En-têtes anti-cache** pour éviter les problèmes de données obsolètes
- **Docker support** pour un déploiement simplifié
- **Gestion des authentifications** plus robuste avec protection des routes

### 4. Authentification et Sécurité 🔒
- Système d'**authentification complet** avec inscription et connexion
- **Gestion des sessions utilisateurs** via JWT (JSON Web Tokens)
- Stockage sécurisé des mots de passe avec **hachage via bcrypt**
- **Protection des routes API** avec middleware d'authentification

### 5. Gestion de Profil Utilisateur 👤
- **Page de profil complète** avec informations personnelles et préférences
- **Upload de photo de profil** avec recadrage et redimensionnement
- **Personnalisation des objectifs nutritionnels** (calories, macronutriments)
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

## 🔄 Dépôt distant Git

### Configuration initiale

1. Créer un dépôt sur GitHub (sans README, .gitignore, ou licence) à l'adresse : https://github.com/new

2. Lier votre dépôt local au dépôt distant :
```bash
git remote add origin https://github.com/votre-utilisateur/nutritrack.git
```

3. Pousser votre code vers le dépôt distant :
```bash
git push -u origin master
```

### Workflow Git recommandé

1. Pour obtenir les dernières modifications :
```bash
git pull origin master
```

2. Pour ajouter vos modifications :
```bash
git add .
git commit -m "Description des modifications"
git push origin master
```

3. Pour créer une branche de fonctionnalité :
```bash
git checkout -b nom-de-la-fonctionnalite
# Après développement et tests
git push origin nom-de-la-fonctionnalite
```

## 📋 Instructions d'exécution pour les testeurs

### Pré-requis
- Node.js v18 ou supérieur
- npm ou yarn
- Git
- Docker et Docker Compose (optionnel)

### Clone et installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/nutritrack.git
cd nutritrack

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

### Accès à l'application
- URL: http://localhost:3001
- Utilisateur test: utilisateur@test.com
- Mot de passe: motdepasse

### Fonctionnalités à tester
- Ajout et suivi des repas
- Système de recommandation alimentaire
- Visualisation des statistiques
- Navigation entre les différentes pages

## Licence
MIT
