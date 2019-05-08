var express = require("express"),
    multer  = require("multer"),
    fs      = require("fs"),
    Idea    = require("../models/idea"),
    Comment = require("../models/comment");
    

var router  = express.Router();

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
                res.render("ideas/index", {ideas: ideas});
            }
        });
    }else{
        Idea.find(function(err, ideas){
            if(err){
                console.log(err);
            }else{
                res.render("ideas/index", {ideas: ideas});
            }
        });
    }
});

// NEW IDEA
router.get("/ideas/new", isLoggedIn, function(req, res){
    res.render("ideas/new");
});

// CREATE IDEA
router.post("/ideas", isLoggedIn, upload.single("image"), function(req, res){
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
            res.render("ideas/show", {idea: idea});
        }
    });
});

// EDIT IDEA
router.get("/ideas/:id/edit", checkIdeaOwner, function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else {
            res.render("ideas/edit", {idea: idea});
        }
    });
});

// UPDATE IDEA 
router.put("/ideas/:id", checkIdeaOwner, upload.single("image"), function(req, res){
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
router.delete("/ideas/:id", checkIdeaOwner, function(req, res){
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

// IS LOGGEDIN MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

function checkIdeaOwner(req, res, next){
    if(req.isAuthenticated()){
        Idea.findById(req.params.id, function(err, idea){
            if(idea.user.id.equals(req.user._id)){
                next();
            }else{
                res.redirect("back");
            }
        });

    }else{
        res.redirect("back");
    }
}

module.exports = router;