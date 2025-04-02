const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protéger les routes
exports.protect = async (req, res, next) => {
  let token;

  // Vérifier la présence du token dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Récupérer le token depuis le header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Vérifier aussi dans les cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // S'assurer que le token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à accéder à cette ressource'
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded);

    // Ajouter l'utilisateur à la requête
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé à accéder à cette ressource'
    });
  }
};

// Accès limité aux rôles spécifiques
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rôle ${req.user.role} non autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};
