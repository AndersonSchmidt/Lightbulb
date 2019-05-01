var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    favicon        = require("express-favicon"),
    multer         = require("multer"),
    mongoose       = require("mongoose"),
    methodOverride = require("method-override"),
    fs             = require("fs"),
    Idea           = require("./models/idea");
    Comment        = require("./models/comment");

mongoose.connect("mongodb://localhost:27017/lightbulb", {useNewUrlParser: true});


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
var upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({extended: true}));
app.use(favicon(__dirname + '/favicon.ico')); 
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");


//MAIN PAGE
app.get("/", function(req, res){
    res.redirect("/ideas");
});

//INDEX - ALL IDEAS
app.get("/ideas", function(req, res){
    Idea.find(function(err, ideas){
        if(err){
            console.log(err);
        }else{
            res.render("ideas/index", {ideas: ideas});
        }
    });
});

//NEW IDEA
app.get("/ideas/new", function(req, res){
    res.render("ideas/new");
});

//CREATE IDEA
app.post("/ideas", upload.single("image"), function(req, res){
    req.body.idea.imagePath = req.file.path.replace('public\\', '/');
    Idea.create(req.body.idea, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.redirect("/ideas/" + idea.id);
        }
    });
});

//SHOW IDEAS
app.get("/ideas/:id", function(req, res){
    Idea.findById(req.params.id).populate("comments").exec(function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.render("ideas/show", {idea: idea});
        }
    });
});

//EDIT IDEA
app.get("/ideas/:id/edit", function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else {
            res.render("ideas/edit", {idea: idea});
        }
    });
});

//UPDATE IDEA 
app.put("/ideas/:id", upload.single("image"), function(req, res){
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

//DELETE IDEA 
app.delete("/ideas/:id", function(req, res){
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

//NEW COMMENT
app.get("/ideas/:id/comments/new", function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {idea: idea});
        }
    });
});

//CREATE COMMENT
app.post("/ideas/:id/comments", function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    idea.comments.push(comment);
                    idea.save();
                    res.redirect("/ideas/" + req.params.id);
                }
            });
        }
    });
}); 

//EDIT COMMENT
app.get("/ideas/:idea_id/comments/:comment_id/edit", function(req, res){
    Comment.findById(req.params.comment_id, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.render("comments/edit", {idea_id: req.params.idea_id, comment: comment});
        }
    });
});

//UPDATE COMMENT
app.put("/ideas/:idea_id/comments/:comment_id", function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.redirect("/ideas/" + req.params.idea_id);
        }
    });
});

//DELETE COMMENT
app.delete("/ideas/:idea_id/comments/:comment_id", function(req, res){
    Comment.findByIdAndDelete(req.params.comment_id, function(err){
        if(err){
            console.log("err");
        }else{
            res.redirect("/ideas/" + req.params.idea_id);
        }
    });
});

app.listen("3000", function(){
    console.log("Lightbulb is Running");
});