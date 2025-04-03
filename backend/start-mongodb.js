/**
 * Script de démarrage avec MongoDB pour NutriTrack
 * 
 * Ce script vous permet de démarrer l'application avec MongoDB
 * en configurant les variables d'environnement nécessaires.
 */

// CONFIGURATION MONGODB - VOUS DEVEZ CONFIGURER CES VALEURS

// Il existe deux façons de configurer MongoDB:

// OPTION 1: Créer un fichier .env à la racine du projet avec les variables suivantes:
// MONGODB_URI=mongodb+srv://votreuser:votremotdepasse@votreinstance.mongodb.net/votrebdd
// JWT_SECRET=votre-clé-secrète-très-complexe

// OPTION 2: Définir directement les variables ci-dessous
// (moins sécurisé, à utiliser uniquement pour les tests)

// Connectez-vous à MongoDB Atlas (https://www.mongodb.com/cloud/atlas) et créez un cluster
// Exemple pour MongoDB local (changez si vous utilisez MongoDB Atlas):
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutritrack';

// Générez une clé secrète forte pour les tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGEZ-MOI-AVEC-UNE-CLE-SECURISEE';

// Configuration de l'application
process.env.MONGODB_URI = MONGODB_URI;
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = JWT_SECRET;
  console.warn('⚠️ ATTENTION: Vous utilisez une clé JWT par défaut, ce qui est peu sécurisé.');
  console.warn('Pour la production, définissez une clé secrète unique dans vos variables d\'environnement.');
}
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
process.env.JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE || '30';

console.log('🔐 Configuration de l\'application chargée');
console.log(`🔌 Tentative de connexion à MongoDB: ${MONGODB_URI}`);

// Tester la connexion MongoDB avant de démarrer le serveur
const mongoose = require('mongoose');

// Options de connexion
const options = {
  // Note: Ces options sont maintenant par défaut dans Mongoose 6+
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
};

// Tenter de se connecter à MongoDB
mongoose.connect(MONGODB_URI, options)
  .then(() => {
    console.log('✅ Connexion MongoDB établie avec succès');
    console.log('🚀 Démarrage du serveur NutriTrack...');
    
    // Démarrer le serveur NutriTrack
    require('./src/server.js');
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    console.log('\n🔍 DÉPANNAGE:');
    console.log('1. Vérifiez que MongoDB est installé et en cours d\'exécution');
    console.log('2. Si vous utilisez MongoDB Atlas, vérifiez votre nom d\'utilisateur/mot de passe');
    console.log('3. Vérifiez que l\'URI MongoDB est correct');
    console.log('\n⚠️ Si vous n\'avez pas MongoDB, utilisez plutôt la commande:');
    console.log('   node local-server.js');
    
    process.exit(1);
  });
