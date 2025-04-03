/**
 * Script de démarrage local pour NutriTrack
 * Ce script permet de démarrer le serveur en mode local sans MongoDB
 */

// Définir les variables d'environnement pour éviter les erreurs
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'local-dev-secret-123456789';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';
process.env.MONGODB_URI = 'disabled'; // Désactive MongoDB

// Charger le serveur
require('./src/server.js');

console.log('==============================================');
console.log('🚀 NutriTrack démarré en mode LOCAL (sans MongoDB)');
console.log('📝 Toutes les données sont stockées localement dans un fichier JSON');
console.log('==============================================');
