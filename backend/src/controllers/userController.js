const User = require('../models/User');

// @desc    Obtenir le profil de l'utilisateur actuel
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Mettre à jour le profil de l'utilisateur
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, phone, bio } = req.body;

    // Vérifier si l'email a changé et s'il est déjà utilisé
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (bio !== undefined) fieldsToUpdate.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Mettre à jour l'avatar de l'utilisateur
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Aucun avatar fourni'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Mettre à jour les préférences de l'utilisateur
// @route   PUT /api/users/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const { dailyCalorieGoal, macroGoals, theme } = req.body;

    // Construire l'objet de préférences
    const preferences = {};
    
    if (dailyCalorieGoal) preferences.dailyCalorieGoal = dailyCalorieGoal;
    
    if (macroGoals) {
      preferences.macroGoals = {};
      if (macroGoals.protein !== undefined) preferences.macroGoals.protein = macroGoals.protein;
      if (macroGoals.carbs !== undefined) preferences.macroGoals.carbs = macroGoals.carbs;
      if (macroGoals.fat !== undefined) preferences.macroGoals.fat = macroGoals.fat;
    }
    
    if (theme) preferences.theme = theme;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
