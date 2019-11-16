var express    = require("express");
var router     = express.Router();
var multer     = require("multer");
var User       = require("../models/user");
var passport   = require("passport");
var async      = require("async");
var nodemailer = require("nodemailer");
var crypto     = require("crypto");
var zipFolder  = require('zip-folder');

// MULTER SETTINGS
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
var upload = multer({ storage: storage });

// MAIN PAGE
router.get("/", function(req, res){
    res.redirect("/ideas");
});

// ============
// AUTH ROUTES
// ============

// Show Sign Up Form
router.get("/register", function(req, res){
    res.render("register");
});

// Sign Up logic
router.post("/register", upload.single("image"), function(req, res){
    var newUser = new User({username: req.body.username, email: req.body.email, bio: req.body.bio});

    newUser.avatarPath = req.file.path.replace('public\\', '/');

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash('error', "A user with the given username or email is already registered");
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/ideas");
        });
    });
});

// Show Login Form
router.get("/login", function(req, res){
    res.render("login");
});

// Login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/ideas",
    failureRedirect: "/login",
    successFlash: "Login successful",
    failureFlash: "The username or password is incorrect"
}), function(req, res){
    
});

// Logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/ideas");
});

// Forgot password
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if(!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour 

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'noreplylightbulb@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'noreplylightbulb@gmail.com',
                subject: 'Lightbulb Password Reset',
                text: 'You are receiving this because you have requested the reset of your Lightbub account password.' + '\n\n' +
                    'Please click the following link to complete the process: ' + '\n\n' +
                    'http://' + req.headers.host + '/reset/' + token
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if(err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
        if(!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
                if(!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash('error', 'Password do not match');
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'noreplylightbulb@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'noreplylightbulb@gmail.com',
                subject: 'Your Lightbulb password has been changed',
                text: 'Hello, \n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just changed.'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/ideas');
    })
});

// FAQ
router.get('/faq', function(req, res) {
    res.render('faq');
});

// Images Backup Download
router.get('/images-backup', function(req, res){
    zipFolder('public/images', 'backup/images.zip', function(err) {
        if(err) {
            console.log('ZIP Images Error: ', err);
        } else {
            res.download('backup/images.zip');
        }
    });
});

// Database Backup Download
router.get('/database-backup', function(req, res) {
        zipFolder('/Users/Anderson/Desktop/Developer/mongodb/bin/dump', 'backup/database.zip', function(err) {
        if(err) {
            console.log('ZIP Database Error: ', err);
        } else {
            res.download('backup/database.zip');
        }
    });
})

module.exports = router;