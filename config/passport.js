const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = require('./google');
const User = require('../services/userService');

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      
      // Vérifier si l'utilisateur existe déjà
      let user = await User.findByEmail(email);
      
      if (user) {
        // Utilisateur existant - mettre à jour googleId si nécessaire
        if (!user.googleId) {
          const updatedUser = await User.update(user.id, {
            googleId: profile.id,
            avatar: profile.photos[0]?.value,
            authProvider: 'google'
          });
          return done(null, updatedUser);
        }
        return done(null, user);
      }
      
      // Créer un nouvel utilisateur
      const newUser = await User.createUser({
        Username: profile.displayName || email.split('@')[0],
        email: email,
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        isActive: true,
        role: 'user',
        permissions: ['read'],
        emailVerified: true,
        authProvider: 'google',
        // Pas de mot de passe pour les utilisateurs Google
        password: null
      });
      
      return done(null, newUser);
      
    } catch (error) {
      console.error('Erreur stratégie Google:', error);
      return done(error, null);
    }
  }
));

// Ces fonctions ne sont pas nécessaires avec session: false
// Mais on les garde pour éviter les erreurs
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;