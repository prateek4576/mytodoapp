import express from 'express';
import passport from '../passport/passport.js';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';


const router = express.Router();
const saltRounds = 10;

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Root Route
router.get('/', (req, res) => {
    res.render('index', { user: req.user, page: 'bg-index' });
});

// Login Routes
router.get('/login', (req, res) => {
    res.render('login', { user: req.user, page: 'bg-login', error: null });
});
router.post('/login', (req, res, next) => {
    console.log('Login attempt with:', req.body);
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.render('login', { user: req.user, page: 'bg-login', error: info.message });
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Google Auth Routes
router.get('/auth/google', 
    passport.authenticate('google', { 
        scope: ['email', 'profile'] 
    }));

router.get('/auth/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
    }));

// Register Routes
router.get('/register', (req, res) => {
    res.render('register', { user: req.user, page: 'bg-register', error: null });
});

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        res.redirect('/login');
        
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { user: req.user, page: 'bg-register', error: 'Email already exists or invalid input' });
    }
});

// Dashboard and Task Routes
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [req.user.id]);
        res.render('dashboard', { user: req.user, tasks: tasks.rows, page: 'bg-dashboard' });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.redirect('/login');
    }
});

router.post('/task', ensureAuthenticated, async (req, res) => {
    try {
        await pool.query('INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3)', 
            [req.user.id, req.body.title, req.body.description]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Add task error:', err);
        res.redirect('/dashboard');
    }
});

router.get('/task/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', 
            [req.params.id, req.user.id]);
        res.render('edit-task', { user: req.user, task: task.rows[0], page: 'bg-edit-task' });
    } catch (err) {
        console.error('Edit task error:', err);
        res.redirect('/dashboard');
    }
});

router.post('/task/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        await pool.query('UPDATE tasks SET title = $1, description = $2, completed = $3 WHERE id = $4 AND user_id = $5',
            [req.body.title, req.body.description, req.body.completed === 'on', req.params.id, req.user.id]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Update task error:', err);
        res.redirect('/dashboard');
    }
});

router.get('/task/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
        const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', 
            [req.params.id, req.user.id]);
        if (task.rows.length > 0 && task.rows[0].completed === true) {
            await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', 
                [req.params.id, req.user.id]);
            console.log(`Task ${req.params.id} deleted by user ${req.user.id}`);
        } else {
            console.log(`Task ${req.params.id} not deleted: not completed or not found`);
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Delete error:', err);
        res.redirect('/dashboard');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/login'));
});

export default router;