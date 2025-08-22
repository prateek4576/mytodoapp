import express from 'express';
import session from 'express-session';
import passport from './passport/passport.js';
import routes from './routes/index.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});