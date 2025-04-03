/**
 * Script de démarrage avec MongoDB pour NutriTrack
 * 
 * Ce script vous permet de démarrer l'application avec MongoDB
 * en configurant les variables d'environnement nécessaires.
 */

// Configuration MongoDB - MODIFIEZ CES VALEURS selon votre installation
// URI pour MongoDB local (par défaut)
const MONGODB_URI = 'mongodb://localhost:27017/nutritrack';

// Ou URI pour MongoDB Atlas (décommentez et personnalisez si vous utilisez Atlas)
// const MONGODB_URI = 'mongodb+srv://username:password@clusterXXX.mongodb.net/nutritrack';

// Configuration de l'application
process.env.MONGODB_URI = MONGODB_URI;
process.env.JWT_SECRET = 'nutritrack-secret-key-2025';
process.env.JWT_EXPIRE = '30d';
process.env.JWT_COOKIE_EXPIRE = '30';

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
