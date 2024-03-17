require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  password:String,
  googleId:String
});

userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
}); 

passport.deserializeUser(function(id, done) {
    User.findById(id).then(function(user){ done(err, user)}).catch(function(err){console.log(err)});
//    User.findById(id, function(err, user) {
//      done(err, user);
//    });          
});




passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrete");
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
