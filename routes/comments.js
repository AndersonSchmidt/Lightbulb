var express = require("express");
var router  = express.Router();

var Idea = require("../models/idea");
var Comment = require("../models/comment");

//NEW COMMENT
router.get("/ideas/:id/comments/new", isLoggedIn, function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {idea: idea});
        }
    });
});

//CREATE COMMENT
router.post("/ideas/:id/comments", isLoggedIn, function(req, res){
    var date = new Date();
    req.body.comment.date = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();
   
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    comment.user.id = req.user._id;
                    comment.user.username = req.user.username;
                    comment.save();
                    idea.comments.push(comment);
                    idea.save();
                    res.redirect("/ideas/" + req.params.id);
                }
            });
        }
    });
}); 

//EDIT COMMENT
router.get("/ideas/:idea_id/comments/:comment_id/edit", checkCommentOwner, function(req, res){
    Comment.findById(req.params.comment_id, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.render("comments/edit", {idea_id: req.params.idea_id, comment: comment});
        }
    });
});

//UPDATE COMMENT
router.put("/ideas/:idea_id/comments/:comment_id", checkCommentOwner, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.redirect("/ideas/" + req.params.idea_id);
        }
    });
});

//DELETE COMMENT
router.delete("/ideas/:idea_id/comments/:comment_id", checkCommentOwner, function(req, res){
    Comment.findByIdAndDelete(req.params.comment_id, function(err){
        if(err){
            console.log("err");
        }else{
            res.redirect("/ideas/" + req.params.idea_id);
        }
    });
});

// IS LOGGEDIN MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

// CHECK COMMENT OWNER MIDDLEWARE
function checkCommentOwner(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment){
            if(err){
                console.log(err);
            }else{
                if(comment.user.id.equals(req.user._id)){
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

module.exports = router;