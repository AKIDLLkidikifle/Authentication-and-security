require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/secreteDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});


const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/register", function(req, res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const user = new User({
            email:req.body.username,
            password:hash
        });
    
        if(user.email==""){
            res.render("register");
        }

        user.save().then(function(){
            res.render("secrets");
        });
    });
});

app.post("/login", function(req, res){
    const  useremail = req.body.username;
    const userpassword = req.body.password;

    User.findOne({email:useremail}).then(function(data){
        if(data=="" || data==null){
            res.send("you are not yet redistered");
        }
        else{
            bcrypt.compare(userpassword, data.password, function(err, result) {
                if(result === true){
                    res.render("secrets");
                }
                else{
                    res.send("incorrect password");
                }
            });
        }
    })
});

app.listen(3000, function(){
    console.log("port 3000 is working");
});
