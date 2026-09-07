import dotenv from 'dotenv';

dotenv.config();

console.log(
    'Google Client ID loaded:',
    !!process.env.GOOGLE_CLIENT_ID
);

console.log(
    'Google Client Secret loaded:',
    !!process.env.GOOGLE_CLIENT_SECRET
);


import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import bcrypt from 'bcrypt';

import User from '../models/user.js';

// Local Login
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },

        async (email, password, cb) => {
            try {
                console.log('Attempting to authenticate:', email);

                const user = await User.findOne({
                    email: email.toLowerCase()
                });

                if (!user) {
                    console.log('Unregistered email attempted:', email);

                    return cb(
                        null,
                        false,
                        {
                            message: `Unregistered email attempted: ${email}. Please register yourself first.`
                        }
                    );
                }

                // Google account does not have a local password
                if (!user.password) {
                    return cb(
                        null,
                        false,
                        {
                            message:
                                'This account uses Google login. Please sign in with Google.'
                        }
                    );
                }

                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    return cb(
                        null,
                        false,
                        {
                            message: 'Incorrect password'
                        }
                    );
                }

                return cb(null, user);

            } catch (err) {
                console.error('Authentication error:', err);
                return cb(err);
            }
        }
    )
);


// Google Login
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

           callbackURL: process.env.GOOGLE_CALLBACK_URL,

            passReqToCallback: true
        },

        async (
            request,
            accessToken,
            refreshToken,
            profile,
            cb
        ) => {
            try {
                const email = profile.email;

                let user = await User.findOne({ email });

                // Existing user
                if (user) {
                    return cb(null, user);
                }

                // New Google user
                user = await User.create({
                    email: email,
                    google_id: profile.id,
                    password: null
                });

                return cb(null, user);

            } catch (err) {
                console.error('Google authentication error:', err);
                return cb(err);
            }
        }
    )
);


// Store user ID in session
passport.serializeUser((user, cb) => {
    cb(null, user.id);
});


// Get user from MongoDB using session ID
passport.deserializeUser(async (id, cb) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            return cb(null, false);
        }

        cb(null, user);

    } catch (err) {
        cb(err);
    }
});


export default passport;