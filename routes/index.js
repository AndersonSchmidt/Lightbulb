var express  = require("express");
var router   = express.Router();
var multer   = require("multer");
var User     = require("../models/user");
var Idea     = require("../models/idea");
var passport = require("passport");
var ObjectId = require('mongoose').Types.ObjectId;

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
    var newUser = new User({username: req.body.username});

    newUser.avatarPath = req.file.path.replace('public\\', '/');

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

router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){

        }else{
            Idea.find({user: ObjectId(req.params.id)}, function(err, ideas){
                if(err){
                    console.log(err);
                }else{
                    res.render("users/show", {user: user, ideas: ideas});
                }
            });
        }
    })
}); 

module.exports = router;