var Idea = require("../models/idea");
var Comment = require("../models/comment");
var User = require("../models/user");

// All the middleware goes here
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please Login First!");
    res.redirect("/login");
}

middlewareObj.checkIdeaOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Idea.findById(req.params.id, function(err, idea){
            if(idea.user.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                res.redirect("back");
            }
        });

    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
}

middlewareObj.checkCommentOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment){
            if(err){
                console.log(err);
            }else{
                if(comment.user.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
}

middlewareObj.checkUserOwner = function(req, res, next) {
    if(req.isAuthenticated()) {
        User.findById(req.params.id, function(err, user) {
            if(err) {
                console.log(err);
            }else {
                if(user._id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect('/ideas');
                }
            }
        })
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
}

module.exports = middlewareObj;