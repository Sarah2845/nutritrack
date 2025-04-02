# Journal des modifications NutriTrack

Ce fichier documente toutes les modifications notables apportées au projet NutriTrack.

## [1.0.0] - 2 avril 2025

### Ajout
- Système d'authentification complet (inscription, connexion, déconnexion)
- Page de profil utilisateur avec les fonctionnalités suivantes :
  - Affichage et modification des informations personnelles
  - Changement sécurisé de mot de passe
  - Upload et affichage de photo de profil avec redimensionnement automatique
  - Paramètres de préférences nutritionnelles personnalisables
- Synchronisation de l'avatar utilisateur entre le tableau de bord et la page de profil
- API sécurisée avec JWT pour la gestion des sessions utilisateurs
- Protection des routes nécessitant une authentification
- Stockage sécurisé des mots de passe avec hachage bcrypt
- Amélioration de l'interface utilisateur avec Bootstrap 5 et icônes Bootstrap

### Corrections
- Correction des problèmes d'encodage de caractères accentués
- Amélioration de la récupération et l'affichage des photos de profil
- Optimisation des performances de l'application

## [0.1.0] - 15 mars 2025 (Version initiale)

### Ajout
- Structure de base du projet (frontend et backend)
- Page d'accueil et tableau de bord initial
- Implémentation des modèles de données pour les utilisateurs
- Configuration du serveur Express avec les routes principales
