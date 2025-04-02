const express = require('express');
const cors = require('cors');
const path = require('path');
const R = require('ramda');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Charger les variables d'environnement
dotenv.config();

// Initialiser une base de données rudimentaire pour le développement
const initializeDatabase = () => {
  console.log('Base de données locale initialisée (version de développement)');
};

// On essaie de charger la configuration MongoDB
let connectDB = null;
try {
  connectDB = require('./config/db');
  console.log('Module MongoDB trouvé');
} catch (err) {
  console.log('Module MongoDB non trouvé, fonctionnement en mode local');
}

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Le serveur fonctionne correctement.' });
});

// Route de test
app.get('/test-server', (req, res) => {
  res.send('<h1>Le serveur NutriTrack fonctionne!</h1>');
});

// Routes API
app.use('/api/users', require('./routes/userRoutes'));

// Vérifions si les routes d'authentification MongoDB existent
let authRoutes;
try {
  authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('Routes d\'authentification MongoDB chargées');
} catch (err) {
  console.log('Routes d\'authentification MongoDB non trouvées, mode de démonstration activé');
  
  // Routes d'authentification de démonstration (fallback)
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'password123') {
      res.json({
        success: true,
        token: 'demo_token_12345',
        user: {
          id: 'demo',
          name: 'Utilisateur Démo',
          email: 'test@example.com',
          role: 'user'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }
  });
  
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès (mode démo)',
      token: 'demo_token_12345',
      user: {
        id: 'demo',
        name,
        email,
        role: 'user'
      }
    });
  });
}

// Initialize database (version locale/test)
initializeDatabase();

// Essayer d'initialiser MongoDB si disponible
if (connectDB) {
  connectDB()
    .then(() => {
      console.log('MongoDB connecté avec succès!');
    })
    .catch(err => {
      console.error('Erreur de connexion MongoDB:', err.message);
      console.log('L\'application fonctionne en mode local');
    });
}

// Routes API - désactivées en mode démo
try {
  const authenticateToken = require('./middlewares/auth.middleware').authenticateToken;
  const mealsRoutes = require('./routes/meals.routes');
  const goalsRoutes = require('./routes/goals.routes');
  const statsRoutes = require('./routes/stats.routes');
  
  app.use('/api/meals', authenticateToken, mealsRoutes);
  app.use('/api/goals', authenticateToken, goalsRoutes);
  app.use('/api/stats', authenticateToken, statsRoutes);
} catch (err) {
  console.log('Routes API avancées non disponibles en mode démo');
  
  // Route API de base pour la démo
  app.get('/api/meals', (req, res) => {
    res.json({
      success: true,
      message: 'Version de démonstration',
      data: [
        { id: 1, name: 'Petit-déjeuner', calories: 450, date: new Date() },
        { id: 2, name: 'Déjeuner', calories: 750, date: new Date() },
        { id: 3, name: 'Dîner', calories: 600, date: new Date() }
      ]
    });
  });
}

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../../frontend')));

// Pour la route racine, servir notre page d'accueil
app.get('/', (req, res) => {
  console.log('Demande de la page d\'accueil');
  res.sendFile(path.join(__dirname, '../../frontend/landing.html'));
});

// Pour la route /app, servir l'application simplifiée
app.get('/app', (req, res) => {
  console.log('Demande de l\'application simplifiée');
  res.sendFile(path.join(__dirname, '../../frontend/app-minimal.html'));
});

// Pour le dashboard simplifié
app.get('/dashboard.html', (req, res) => {
  console.log('Demande du tableau de bord');
  res.sendFile(path.join(__dirname, '../../frontend/dashboard.html'));
});

// Pour la page de profil
app.get('/profile.html', (req, res) => {
  console.log('Demande de la page de profil');
  res.sendFile(path.join(__dirname, '../../frontend/profile.html'));
});

// Pour l'ancienne application (si besoin)
app.get('/app-full', (req, res) => {
  console.log('Demande de l\'application complète');
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Pour le test des modules
app.get('/test-modules', (req, res) => {
  console.log('Demande de la page de test des modules');
  res.sendFile(path.join(__dirname, '../../frontend/tester.html'));
});

// Route supprimée - Déjà définie plus haut

// Pour toutes les autres routes HTML, rediriger vers la page d'accueil
app.get('*.html', (req, res, next) => {
  // Si c'est une des pages spécifiques que nous avons créées
  if (req.url === '/dashboard.html' || req.url === '/app-minimal.html') {
    return next();
  }
  // Sinon, rediriger vers la page d'accueil
  console.log('Redirection vers la page d\'accueil pour:', req.url);
  res.redirect('/');
});

// Pour toutes les autres routes, servir l'application frontend
app.get('*', (req, res, next) => {
  // Si c'est une demande pour l'API
  if (req.url.startsWith('/api')) {
    return next();
  }
  // Sinon, vérifier si c'est un fichier statique
  if (req.url.includes('.')) {
    return next();
  }
  // Pour les routes inconnues, rediriger vers la page d'accueil
  console.log('Route générique: ', req.url);
  res.redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Configuration du port et démarrage du serveur
const PORT = process.env.PORT || 3001;

// La connexion MongoDB est gérée plus haut dans le code

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend accessible à l'adresse: http://localhost:${PORT}`);
  console.log(`API d'authentification disponible sur http://localhost:${PORT}/api/auth`);
});

module.exports = app; // For testing
