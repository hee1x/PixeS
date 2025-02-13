const express = require('express');
const router = express.Router();
const User = require('../models/User');
const alertMessage = require('../helpers/messenger');
const passport = require('passport');
var bcrypt = require('bcryptjs');
const flash = require("connect-flash");
const JWT_SECRET = 'some super secret...'
const jwt = require("jsonwebtoken");

router.get('/updateAccount/:id', (req, res) =>{
    req.flash('id', req.params.id)
	res.render('user/update')
})

// User register URL using HTTP post => /user/register
router.post('/register', (req, res) => {
    let errors = []
    let success_msg = '';

    // Excercise 3
    let { name, email, password, password2 } = req.body;
    if (password !== password2) {
        errors.push({ text: 'Passwords do not match' });
    }
    // Checks that password length is more than 4
    if (password.length < 4) {
        errors.push({ text: 'Password must be at least 4 characters' });
    }
    if (errors.length > 0) {
        res.render('user/register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        // If all is well, checks if user is already registered
        User.findOne({ where: { email: email } })
            .then(user => {
                if (user) {
                    let msg = email + 'already registered';
                    alertMessage(res, 'danger', msg, 'fas fa-exclamation-circle', false);
                    res.render('user/register', {
                        name, email
                    });
                }
                else {
                    // Create new user record
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(password, salt, function (err, hash) {
                            if (err) throw err;
                            User.create({ name, email, password: hash })
                                .then(user => {
                                    let msg = user.email + 'registered succesfully';
                                    alertMessage(res, 'success', msg, 'fas fa-sign-in-alt', true);
                                    res.redirect('/showLogin');
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            });
    }
});

// Login Form POST => /user/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/chat', // Route to /video/listVideos URL
        failureRedirect: '/showLogin', // Route to /login URL
        failureFlash: true
        /* Setting the failureFlash option to true instructs Passport to flash an error message using the
       message given by the strategy's verify callback, if any. When a failure occur passport passes the message
       object as error */
    })(req, res, next);
});

router.post('/update', (req, res) => {
    let id = req.flash('id')
    let errors = []
    let success_msg = '';

    // Excercise 3
    let { name, email, password, password2 } = req.body;
    if (errors.length > 0) {
        res.render('user/update', {
            errors,
            name,
            email
        });
    } else {
        // If all is well, checks if user is already registered
            // update existing user record
            User.update({name: name}, {where: {id: id} })
            User.update({email: email}, {where: {id: id} })
                .then(user => {
                    let msg = user.email + 'updated succesfully';
                    alertMessage(res, 'success', msg, 'fas fa-sign-in-alt', true);
                    res.redirect('/showProfile');
                })
                .catch(err => console.log(err));
    }
});

router.post('/showForgot', (req, res, next) => {
    let {email} = req.body;
	console.log(email);
    User.findOne({ where: { email: email } })
            .then(user => {
                if (user) {
                    const secret = JWT_SECRET + user.password
                    const payload = {
                        email: user.email,
                        id: user.id
                    }
                    const token = jwt.sign(payload, secret, {expiresIn: "15m"})
                    const link = `http://localhost:5000/user/reset-password/${user.id}/${token}`;
                    console.log(link);
                }
                else {
                    let msg = email + 'not registered';
                    alertMessage(res, 'danger', msg, 'fas fa-exclamation-circle', false);
                    console.log("not registered")
                }
            });
})

router.get('/reset-password/:id/:token', (req, res) =>{
	const {id, token} = req.params;
	User.findOne({ where: { id: id } })
            .then(user => {
                if (user) {
                    const secret = JWT_SECRET + user.password;
					try{
						const payload = jwt.verify(token, secret);
						res.render('user/reset-password', {email: user.email});
					}finally{}
                }
                else {
                    let msg = 'Invalid ID';
                    alertMessage(res, 'danger', msg, 'fas fa-exclamation-circle', false);
                    console.log("Invalid ID");
                }
            });
})

router.post('/reset-password/:id/:token', (req, res, next) =>{
    const {id, token} = req.params;
    let { password, password2 } = req.body;
    let errors = []
    User.findOne({ where: { id: id } })
            .then(user => {
                if (user) {
                    if (password !== password2) {
                        errors.push({ text: 'Passwords do not match' });
                        console.log("passwords match")
                    }
                    if (password.length < 4) {
                        errors.push({ text: 'Password must be at least 4 characters' });
                        console.log("through")
                    }
                    if (errors.length > 0) {
                        res.render('user/register', {
                            errors,
                            password,
                            password2
                        });
                    }else{
                        bcrypt.genSalt(10, function (err, salt) {
                            bcrypt.hash(password, salt, function (err, hash) {
                                if (err) throw err;
                                User.update({password:hash}, {where: {id: id} })
                                .then(user => {
                                    let msg = user.email + 'password changed succesfully';
                                    alertMessage(res, 'success', msg, 'fas fa-sign-in-alt', true);
                                    res.redirect('/showLogin');
                                })
                                .catch(err => console.log(err));
                            })
                        });
                    }
                }
                else{
                    let msg = 'Invalid ID';
                    alertMessage(res, 'danger', msg, 'fas fa-exclamation-circle', false);
                    console.log("Invalid ID");
                }
            });
})

module.exports = router;

