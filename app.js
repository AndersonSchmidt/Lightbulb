var express        = require("express"),
    app            = express(),
    bodyParser     = require("body-parser"),
    favicon        = require("express-favicon"),
    mongoose       = require("mongoose"),
    methodOverride = require("method-override"),
    expressSession = require("express-session"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    User           = require("./models/user");

var ideaRoutes    = require("./routes/ideas"),
    commentRoutes = require("./routes/comments"),
    userRoutes    = require("./routes/users"),
    indexRoutes   = require("./routes/index");

// MONGO CONNECTION
mongoose.connect("mongodb://localhost:27017/lightbulb", {useNewUrlParser: true});

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

// ROUTES
app.use(ideaRoutes);
app.use(commentRoutes);
app.use(userRoutes);
app.use(indexRoutes);


app.listen("3000", function(){
    console.log("Lightbulb is Running");
});