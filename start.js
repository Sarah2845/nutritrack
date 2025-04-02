/**
 * Script de démarrage pour NutriTrack
 * Permet de lancer l'application backend et d'ouvrir le frontend
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Vérifie si le fichier de base de données existe
const dbPath = path.join(__dirname, 'backend', 'data', 'db.json');
const dbExamplePath = path.join(__dirname, 'backend', 'data', 'db.example.json');

if (!fs.existsSync(dbPath)) {
  console.log('Création du fichier de base de données à partir de l\'exemple...');
  fs.copyFileSync(dbExamplePath, dbPath);
  console.log('Fichier de base de données créé avec succès !');
}

// Démarre le serveur backend
console.log('Démarrage du serveur NutriTrack...');
const server = spawn('node', ['backend/src/server.js'], { stdio: 'inherit' });

server.on('error', (err) => {
  console.error('Erreur lors du démarrage du serveur:', err);
});

console.log('Serveur démarré ! L\'API est disponible sur http://localhost:3001');
console.log('Pour utiliser l\'application, accédez à http://localhost:3001 dans votre navigateur');
console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
