var express    = require("express"),
    multer     = require("multer"),
    fs         = require("fs"),
    Idea       = require("../models/idea"),
    Comment    = require("../models/comment"),
    middleware = require("../middleware");

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

// SHOW IDEAS
router.get("/ideas", function(req, res){
    if(req.query.search){
        function escapeRegex(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        };
        const searchRegex = new RegExp(escapeRegex(req.query.search), 'gi');
        Idea.find({$or: [{name: searchRegex}, {description: searchRegex}]}, function(err, ideas){
            if(err){
                console.log(err);
            }else{
                //Checking what idea the current liked (to change de lightbulb icon)
                if(req.user){
                    ideas.forEach(function(idea){
                        idea.likes.forEach(function(like){
                            if(like.user.id.equals(req.user.id)){
                                idea.isLiked = true;
                            }
                        })
                    });
                }
                //Sorting ideas by descending likes
                ideas.sort(function(a, b){
                    return b.likes.length - a.likes.length;
                })
                res.render("ideas/index", {ideas: ideas});
            }
        });
    }else{
        Idea.find(function(err, ideas){
            if(err){
                console.log(err);
            }else{
                //Checking what idea the current User liked (to change de lightbulb icon)
                if(req.user){
                    ideas.forEach(function(idea){
                        idea.likes.forEach(function(like){
                            if(like.user.id.equals(req.user.id)){
                                idea.isLiked = true;
                            }
                        })
                    });
                }
                //Sorting ideas by descending likes
                ideas.sort(function(a, b){
                    return b.likes.length - a.likes.length;
                })
                res.render("ideas/index", {ideas: ideas});
            }
        });
    }
});

// NEW IDEA
router.get("/ideas/new", middleware.isLoggedIn, function(req, res){
    res.render("ideas/new");
});

// CREATE IDEA
router.post("/ideas", middleware.isLoggedIn, upload.single("image"), function(req, res){
    var date = new Date();
    req.body.idea.date = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();

    req.body.idea.imagePath = req.file.path.replace('public\\', '/');

    var user = {
        id: req.user._id,
        username: req.user.username
    }
    req.body.idea.user = user;

    Idea.create(req.body.idea, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.redirect("/ideas/" + idea.id);
        }
    });
});

// SHOW IDEA
router.get("/ideas/:id", function(req, res){
    Idea.findById(req.params.id).populate("comments").exec(function(err, idea){
        if(err){
            console.log(err);
        }else{
             //Checking if the current User liked this idea (to change de lightbulb icon)
             if(req.user){
                idea.likes.forEach(function(like){
                    if(like.user.id.equals(req.user.id)){
                        idea.isLiked = true;
                    }
                });
            }
            res.render("ideas/show", {idea: idea});
        }
    });
});

// EDIT IDEA
router.get("/ideas/:id/edit", middleware.checkIdeaOwner, function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else {
            res.render("ideas/edit", {idea: idea});
        }
    });
});

// UPDATE IDEA 
router.put("/ideas/:id", middleware.checkIdeaOwner, upload.single("image"), function(req, res){
    if(req.file){
        req.body.idea.imagePath = req.file.path.replace('public\\', '/');
    }
    Idea.findByIdAndUpdate(req.params.id, req.body.idea, function(err, idea){
        if(err){
            console.log(err);
        }else {
            res.redirect("/ideas/" + req.params.id);
        }
    }) ;
});

// DELETE IDEA 
router.delete("/ideas/:id", middleware.checkIdeaOwner, function(req, res){
    Idea.findByIdAndDelete(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }

        fs.unlink("public/" + idea.imagePath, function (err) {
            if (err) throw err;
            console.log('File deleted!');
        });

        Comment.deleteMany({_id: { $in: idea.comments }}, function(err, comment){
            if(err){
                console.log(err);
            }else{
                res.redirect("/ideas");
            }
        })

    });
});

router.post("/ideas/:id/likes", middleware.isLoggedIn, function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            var isLiked = false;

            idea.likes.forEach(function(like){
                if(like.user.id.equals(req.user.id)){
                    var index = idea.likes.indexOf(like);
                    idea.likes.splice(index, 1);
                    isLiked = true;
                }
            });

            if(!isLiked){
                var like = {
                    user: {
                        id: req.user.id
                    }
                }
                idea.likes.push(like);
            }

            idea.save();

            res.redirect("back");
        }
    });
});

module.exports = router;