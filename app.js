require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:true}));

app.use(session({secret: "my little secrate",resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secreteDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportlocalmongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/secrete", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.render("login");
    }
})

app.post("/register", function(req, res){
      User.register({username:req.body.username}, req.body.password, function(err, user) {
         if (err) {
            console.log(err);
            res.redirect("/register");
         }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrete");
            })
         }
      });
});


app.post("/login", function(req, res){
     const user = new User({
        username: req.body.username,
        password: req.body.password
     });

     req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrete");
            })
        }
     })
});

app.get("/logout", function(req, res){
    req.logout(function(){
        res.redirect("/");
    }); 
});

app.listen(3000, function(){
    console.log("port 3000 is working");
});
