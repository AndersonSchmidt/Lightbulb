var express    = require("express"),
    app        = express(),
    bodyParser = require("body-parser"),
    favicon    = require("express-favicon"),
    multer     = require("multer"),
    mongoose   = require("mongoose");

mongoose.connect("mongodb://localhost:27017/lightbulb", {useNewUrlParser: true});

var ideaSchema = new mongoose.Schema({
    name: String,
    description: String,
    imagePath: String
});
var Idea = new mongoose.model("Idea", ideaSchema);

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
app.set("view engine", "ejs");


//MAIN PAGE
app.get("/", function(req, res){
    res.send("It works");
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

//NEW
app.get("/ideas/new", function(req, res){
    res.render("ideas/new");
});

//CREATE
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

//SHOW
app.get("/ideas/:id", function(req, res){
    Idea.findById(req.params.id, function(err, idea){
        if(err){
            console.log(err);
        }else{
            res.render("ideas/show", {idea: idea});
        }
    });
});

app.listen("3000", function(){
    console.log("The Server is Running");
});