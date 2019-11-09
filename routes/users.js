var express = require("express"),
    multer  = require("multer"),
    User    = require("../models/user"),
    Idea    = require("../models/idea"),
    Comment = require("../models/comment");
    middleware = require("../middleware");
    
var ObjectId = require('mongoose').Types.ObjectId;
var router = express.Router();

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

// SHOW USER
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else if(user){
            Idea.find({user: ObjectId(req.params.id)}, function(err, ideas){
                if(err){
                    console.log(err);
                }else{
                    res.render("users/show", {user: user, ideas: ideas});
                }
            }); 
        }else {
            req.flash('error', 'This user does not exist');
            res.redirect('/ideas');
        }
    })
}); 

// EDIT USER
router.get("/users/:id/edit", middleware.checkUserOwner, function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render("users/edit", {user: user});           
        }
    });
});

// UPDATE USER
router.put("/users/:id", middleware.checkUserOwner, upload.single("image"), function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            if(req.body.oldPassword && req.body.newPassword){
                user.changePassword(req.body.oldPassword, req.body.newPassword);
            }
            if(req.file){
                user.avatarPath = req.file.path.replace('public\\', '/');
            }
            user.username = req.body.username;
            user.email = req.body.email;
            user.bio = req.body.bio;
            user.save();
            req.logIn(user, function(err) {
                if (err) {
                    console.log(err);
                }else{
                    res.redirect("/ideas");
                }
            });
        }
    });
});

// DELETE USER
router.delete("/users/:id", middleware.checkUserOwner, function(req, res){
    User.findByIdAndDelete(req.params.id, function(err, user){
        if(err){
            console.log(err);
        }else{
            Idea.deleteMany({user: ObjectId(req.params.id)}, function(err, ideas){
                if(err){
                    console.log(err);
                }else{
                    Comment.deleteMany({user: ObjectId(req.params.id)}, function(err, comments){
                        if(err){
                            console.log(err);
                        }else{
                            res.redirect("/ideas");
                        }
                    });
                }
            })
        }
    });
});

module.exports = router;