/**
 * Configuration MongoDB pour NutriTrack
 * 
 * Ce fichier configure la connexion MongoDB pour l'application NutriTrack.
 * Pour utiliser MongoDB, exécutez : node src/server.js --use-mongodb
 */

// Configuration MongoDB - Remplacez par vos propres valeurs si nécessaire
process.env.MONGODB_URI = 'mongodb+srv://nutritrack:nutritrack123@cluster0.mongodb.net/nutritrack';
process.env.JWT_SECRET = 'nutritrack-secret-key-2025';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';

console.log('Configuration MongoDB chargée avec succès');
console.log('URI MongoDB configurée');

// Charge le serveur principal
require('./src/server.js');
