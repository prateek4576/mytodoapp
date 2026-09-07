import express from 'express';
import passport from '../passport/passport.js';
import bcrypt from 'bcrypt';

import User from '../models/user.js';
import Task from '../models/task.js';

const router = express.Router();

const saltRounds = 10;


// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
};


// =====================================================
// ROOT
// =====================================================

router.get('/', (req, res) => {
    res.render('index', {
        user: req.user,
        page: 'bg-index'
    });
});


// =====================================================
// LOGIN
// =====================================================

router.get('/login', (req, res) => {
    res.render('login', {
        user: req.user,
        page: 'bg-login',
        error: null
    });
});


router.post('/login', (req, res, next) => {

    console.log('Login attempt with:', req.body);

    passport.authenticate(
        'local',
        (err, user, info) => {

            if (err) {
                return next(err);
            }

            if (!user) {
                return res.render('login', {
                    user: req.user,
                    page: 'bg-login',
                    error: info?.message || 'Login failed'
                });
            }

            req.logIn(user, (err) => {

                if (err) {
                    return next(err);
                }

                return res.redirect('/dashboard');
            });
        }
    )(req, res, next);
});


// =====================================================
// GOOGLE AUTH
// =====================================================

router.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['email', 'profile']
    })
);


router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
    })
);


// =====================================================
// REGISTER
// =====================================================

router.get('/register', (req, res) => {

    res.render('register', {
        user: req.user,
        page: 'bg-register',
        error: null
    });

});


router.post('/register', async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('register', {
                user: req.user,
                page: 'bg-register',
                error: 'Email and password are required'
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.render('register', {
                user: req.user,
                page: 'bg-register',
                error: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );

        await User.create({
            email: email.toLowerCase(),
            password: hashedPassword
        });

        res.redirect('/login');

    } catch (err) {

        console.error('Registration error:', err);

        res.render('register', {
            user: req.user,
            page: 'bg-register',
            error: 'Registration failed'
        });

    }

});


// =====================================================
// DASHBOARD
// =====================================================

router.get(
    '/dashboard',
    ensureAuthenticated,
    async (req, res) => {

        try {

            const tasks = await Task.find({
                user_id: req.user._id
            }).sort({
                createdAt: -1
            });

            res.render('dashboard', {
                user: req.user,
                tasks: tasks,
                page: 'bg-dashboard'
            });

        } catch (err) {

            console.error('Dashboard error:', err);

            res.redirect('/login');
        }
    }
);


// =====================================================
// ADD TASK
// =====================================================

router.post(
    '/task',
    ensureAuthenticated,
    async (req, res) => {

        try {

            await Task.create({
                user_id: req.user._id,
                title: req.body.title,
                description: req.body.description,
                completed: false
            });

            res.redirect('/dashboard');

        } catch (err) {

            console.error('Add task error:', err);

            res.redirect('/dashboard');
        }
    }
);


// =====================================================
// EDIT TASK PAGE
// =====================================================

router.get(
    '/task/edit/:id',
    ensureAuthenticated,
    async (req, res) => {

        try {

            const task = await Task.findOne({
                _id: req.params.id,
                user_id: req.user._id
            });

            if (!task) {
                return res.redirect('/dashboard');
            }

            res.render('edit-task', {
                user: req.user,
                task: task,
                page: 'bg-edit-task'
            });

        } catch (err) {

            console.error('Edit task error:', err);

            res.redirect('/dashboard');
        }
    }
);


// =====================================================
// UPDATE TASK
// =====================================================

router.post(
    '/task/edit/:id',
    ensureAuthenticated,
    async (req, res) => {

        try {

            await Task.findOneAndUpdate(
                {
                    _id: req.params.id,
                    user_id: req.user._id
                },
                {
                    title: req.body.title,
                    description: req.body.description,
                    completed: req.body.completed === 'on'
                }
            );

            res.redirect('/dashboard');

        } catch (err) {

            console.error('Update task error:', err);

            res.redirect('/dashboard');
        }
    }
);


// =====================================================
// DELETE TASK
// =====================================================

router.get(
    '/task/delete/:id',
    ensureAuthenticated,
    async (req, res) => {

        try {

            const task = await Task.findOne({
                _id: req.params.id,
                user_id: req.user._id
            });

            if (!task) {
                return res.redirect('/dashboard');
            }

            if (task.completed === true) {

                await Task.deleteOne({
                    _id: req.params.id,
                    user_id: req.user._id
                });

                console.log(
                    `Task ${req.params.id} deleted by user ${req.user._id}`
                );

            } else {

                console.log(
                    `Task ${req.params.id} not deleted: not completed`
                );
            }

            res.redirect('/dashboard');

        } catch (err) {

            console.error('Delete error:', err);

            res.redirect('/dashboard');
        }
    }
);


// =====================================================
// LOGOUT
// =====================================================

router.get('/logout', (req, res) => {

    req.logout((err) => {

        if (err) {
            console.error('Logout error:', err);
        }

        res.redirect('/login');
    });

});


export default router;