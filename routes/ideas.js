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
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var page = pageQuery ? pageQuery : 1;
    var noMatch = null;

    if(req.query.search){
        function escapeRegex(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        };
        const searchRegex = new RegExp(escapeRegex(req.query.search), 'gi');
        Idea.find({$or: [{name: searchRegex}, {description: searchRegex}]}).sort({totalLikes: 'desc'}).skip((perPage * page) - perPage).limit(perPage).populate("user").exec(function(err, ideas){
            Idea.countDocuments({$or: [{name: searchRegex}, {description: searchRegex}]}).exec(function (err, count) {
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
                    res.render("ideas/index", {
                        ideas: ideas,
                        current: page,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    }else{
        Idea.find().sort({totalLikes: 'desc'}).skip((perPage * page) - perPage).limit(perPage).populate("user").exec(function(err, ideas){
            Idea.countDocuments().exec(function (err, count) {
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
                    res.render("ideas/index", {
                        ideas: ideas,
                        current: page,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
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

    req.body.idea.user = req.user._id;

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
    Idea.findById(req.params.id).populate("user").populate({path: 'comments', populate: {path: 'user'}}).exec(function(err, idea){
        if(err){
            console.log(err);
        }else if(idea){
            //Checking if the current User liked this idea (to change the lightbulb icon)
            if(req.user){
                idea.likes.forEach(function(like){
                    if(like.user.id.equals(req.user.id)){
                        idea.isLiked = true;
                    }
                });
            }
            res.render("ideas/show", {idea: idea});
        }else{
            res.redirect("/ideas");
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

//LIKE OR DISLIKE AN IDEA
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
                    idea.totalLikes --;
                    isLiked = true;
                }
            });

            if(!isLiked){
                var like = {
                    user: {
                        id: req.user.id
                    }
                }
                idea.totalLikes ++;
                idea.likes.push(like);
            }

            idea.save();

            res.redirect("back");
        }
    });
});

module.exports = router;