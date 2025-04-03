# NutriTrack - Version Docker

## Introduction
Cette version de NutriTrack a été dockerisée pour faciliter le déploiement et les tests. Les principales améliorations incluent :

- **Résolution des problèmes d'affichage des recommandations alimentaires**
- **Meilleure gestion de l'authentification**
- **Optimisation de l'accès à la base de données avec lowdb**
- **Affichage fiable des repas et des recommandations**
- **Interface utilisateur cohérente et navigation améliorée**

## Prérequis
- Docker installé sur la machine
- Docker Compose installé sur la machine

## Instructions d'installation et d'exécution

### Option 1 : Utiliser Docker Compose (recommandé)
1. Ouvrez un terminal dans le répertoire racine du projet (où se trouve docker-compose.yml)
2. Exécutez la commande suivante :
```bash
docker-compose up -d
```
3. Accédez à l'application via votre navigateur à l'adresse : http://localhost:3001

### Option 2 : Utiliser Docker directement
1. Construire l'image :
```bash
docker build -t nutritrack .
```

2. Lancer le conteneur :
```bash
docker run -p 3001:3001 -d nutritrack
```

3. Accédez à l'application via votre navigateur à l'adresse : http://localhost:3001

## Fonctionnalités clés et mises à jour
- **Mode local** : L'application utilise un stockage JSON local via lowdb 
- **Accès direct à la base de données** : Optimisation des requêtes pour éviter les problèmes de chargement des données
- **Anti-cache** : Mise en place d'en-têtes spécifiques pour éviter les problèmes de mise en cache
- **Recommandations alimentaires** : Système robuste avec des solutions de secours en cas d'erreur
- **Gestion des erreurs améliorée** : Les erreurs sont gérées de manière élégante sans perturber l'expérience utilisateur

## Notes importantes
- Les données sont persistantes entre les redémarrages du conteneur grâce au montage de volume
- Compte de test par défaut : `utilisateur@test.com` / `motdepasse`
- L'application est configurée pour utiliser la base de données locale par défaut

## Support et dépannage
Si vous rencontrez des problèmes :
1. Vérifiez les logs Docker : `docker logs nutritrack-app`
2. Redémarrez le conteneur : `docker-compose restart` ou `docker restart nutritrack-app`
3. Reconstruisez l'image en cas de modifications : `docker-compose build` ou `docker build -t nutritrack .`
