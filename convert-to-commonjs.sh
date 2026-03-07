#!/bin/bash
# Script to convert all API files from ESM to CommonJS and update imports

cd apps/api

# Update config files
cat > src/config/passport.js << 'EOF'
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { config } = require('./env.js');
const { userRepository } = require('../repositories/user.repository.js');

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.client_id,
      clientSecret: config.google.client_secret,
      callbackURL: config.google.callback_url,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userRepository.findByGoogleId(profile.id);

        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await userRepository.findByEmail(email);
            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              user = await userRepository.create({
                name: profile.displayName,
                email,
                googleId: profile.id,
                profile: {
                  interests: [],
                  dailyMinutes: 60,
                  goal: 'General Learning',
                },
              });
            }
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
EOF

echo "✓ passport.js converted to CommonJS"
