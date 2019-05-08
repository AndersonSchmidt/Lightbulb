var express  = require("express");
var router   = express.Router();
var User     = require("../models/user");
var passport = require("passport");

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
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
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
    failureRedirect: "/login"
}), function(req, res){
    
})

// Logout route
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/ideas");
});

module.exports = router;