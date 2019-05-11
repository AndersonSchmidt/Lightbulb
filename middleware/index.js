var Idea = require("../models/idea");
var Comment = require("../models/comment");

// All the middleware goes here
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

middlewareObj.checkIdeaOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Idea.findById(req.params.id, function(err, idea){
            if(idea.user.id.equals(req.user._id) || req.user.isAdmin){
                next();
            }else{
                res.redirect("back");
            }
        });

    }else{
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwner = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment){
            if(err){
                console.log(err);
            }else{
                if(comment.user.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    res.redirect("back");
                }
            }
        });
    }else{
        res.redirect("/login");
    }
}

module.exports = middlewareObj;