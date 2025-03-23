const express = require('express');
const passport = require('passport');
const { Strategy: SamlStrategy } = require('passport-saml');
const session = require('express-session');
const bodyParser = require("body-parser");
require('dotenv').config();

const app = express();

// SAML configuration
const samlConfig = {
  callbackUrl: process.env.SAML_CALLBACK_URL,
  entryPoint: process.env.SAML_ISSUER_URL,
  issuer: 'urn:' + process.env.SAML_ISSUER,
  cert: process.env.SAML_CERTIFICATE,
  wantAuthnResponseSigned: true,
  acceptedClockSkewMs: 5 * 1000,
};

// Configure Passport
passport.use(new SamlStrategy(samlConfig, (profile, done) => {
  // not dealing with profile yet
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  // not dealing with user yet
  // console.log('Serialize User:', user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  // not dealing with user yet
  // console.log('Deserialize User:', user);
  done(null, user);
});

// Middleware
app.use(session({
  secret: process.env.PASSPORT_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',
  (req, res, next) => {
    console.log('Login route hit');
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true })(req, res, next);
  }
);


app.post('/callback', bodyParser.urlencoded({ extended: false }), (req, res, next) => {
  // abuse RelayState to handle logout for now
  if (req.body.SAMLResponse && req.body.RelayState === 'logout') {
    // Handle Logout
    res.redirect('/');
  } else {
    // Handle Login Authentication Response
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true })(req, res, next);
  }
}, (req, res) => {
  // Login success handler
  console.log('Callback post-authentication');
  if (req.isAuthenticated()) {
    console.log('User authenticated, redirecting to home');
    res.redirect('/');
  } else {
    console.log('Authentication failed');
    res.redirect('/');
  }
});


app.get('/logout', (req, res) => {
  console.log('Logout route hit');
  const samlStrategy = passport._strategies.saml;
  req.query.RelayState = encodeURIComponent('logout');
  samlStrategy.logout(req, (err, url) => {
    console.log('SAML logout URL:', url);
    if (err) {
      console.error('Error getting SAML logout URL:', err);
      return res.redirect('/');
    }

    // Destroy the session
    req.logout(() => {
      console.log('session destroy');
      req.session.destroy();
      // Redirect to IdP logout URL if available, otherwise redirect home
      res.redirect(url || '/');
    });
  });
});

// home route
app.get('/', (req, res) => {
  console.log('user', req.user);
  console.log('Home route hit, authenticated:', req.isAuthenticated());
  res.send(req.isAuthenticated() ? 'Logged in' : 'Logged out');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

