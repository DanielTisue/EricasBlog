require('dotenv').config();
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");

var Post = require("./models/post");
var Comment = require("./models/comment");
var User = require("./models/user");
var middleware = require("./middleware");

//requiring routes
var commentRoutes    = require("./routes/comments"),
    postsRoutes = require("./routes/posts"),
    indexRoutes      = require("./routes/index");

mongoose.connect("mongodb://localhost:27017/erica_blog", {useNewUrlParser: true});
//var url = process.env.DATABASEURL || "mongodb://localhost:27017/erica_blog";
//mongoose.connect(url, {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Once again Max wins craziest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/posts", postsRoutes);
app.use("/posts/:id/comments", commentRoutes);


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server Started!");
});