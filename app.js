var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    favicon        = require("express-favicon"),
    multer         = require("multer"),
    mongoose       = require("mongoose"),
    methodOverride = require("method-override"),
    fs             = require("fs"),
    expressSession = require("express-session"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    Idea           = require("./models/idea"),
    Comment        = require("./models/comment"),
    User           = require("./models/user");

// MONGO CONNECTION
mongoose.connect("mongodb://localhost:27017/lightbulb", {useNewUrlParser: true});

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

// GENERAL APP SETTINGS
app.use(bodyParser.urlencoded({extended: true}));
app.use(favicon(__dirname + '/favicon.ico')); 
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// AUTHENTICATION SETTINGS
app.use(expressSession({
    secret: "My app is going to be famous!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Custom Middleware for every template
app.use(function(req, res, next){
    res.locals.currentUser =  req.user;
    next();
});

//MAIN PAGE
app.get("/", function(req, res){
    res.redirect("/ideas");
});

//INDEX - ALL IDEAS
app.get("/ideas", function(req, res){
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

//NEW IDEA
app.get("/ideas/new", isLoggedIn, function(req, res){
    res.render("ideas/new");
});

//CREATE IDEA
app.post("/ideas", isLoggedIn, upload.single("image"), function(req, res){
    var date = new Date();
    req.body.idea.date = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();

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
app.get("/ideas/:id/comments/new", isLoggedIn, function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {idea: idea});
        }
    });
});

//CREATE COMMENT
app.post("/ideas/:id/comments", isLoggedIn, function(req, res){
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

// ============
// AUTH ROUTES
// ============

// Show Sign Up Form
app.get("/register", function(req, res){
    res.render("register");
});

// Sign Up logic
app.post("/register", function(req, res){
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
app.get("/login", function(req, res){
    res.render("login");
});

// Login logic
app.post("/login", passport.authenticate("local", {
    successRedirect: "/ideas",
    failureRedirect: "/login"
}), function(req, res){
    
})

// Logout route
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/ideas");
});

// IS LOGGEDIN MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
} 

app.listen("3000", function(){
    console.log("Lightbulb is Running");
});