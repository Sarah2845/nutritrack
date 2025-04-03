/**
 * Configuration MongoDB pour NutriTrack
 * 
 * Ce fichier configure la connexion MongoDB pour l'application NutriTrack.
 * Pour utiliser MongoDB, exécutez : node src/server.js --use-mongodb
 */

// IMPORTANT: Configurez vos propres valeurs dans un fichier .env ou en variables d'environnement
// Exemple de configuration requise (à NE PAS remplir ici):
// - MONGODB_URI: L'URI de connexion à votre base de données MongoDB
// - JWT_SECRET: Une clé secrète pour signer les tokens JWT
// - JWT_EXPIRE: Durée de validité des tokens JWT
// - JWT_COOKIE_EXPIRE: Durée de validité des cookies

// Vérification que les variables d'environnement nécessaires sont définies
if (!process.env.MONGODB_URI) {
  console.error('❌ ERREUR: Variable d\'environnement MONGODB_URI non définie');
  console.log('Veuillez définir MONGODB_URI dans un fichier .env ou dans vos variables d\'environnement');
  console.log('Format: mongodb+srv://username:password@cluster.mongodb.net/database');
  console.log('\n⚠️ Par défaut, le système utilisera le stockage local JSON');
}

// Configuration par défaut si non spécifiée
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
process.env.JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE || '30';

console.log('Configuration MongoDB chargée avec succès');
console.log('URI MongoDB configurée');

// Charge le serveur principal
require('./src/server.js');
