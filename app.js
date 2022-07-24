//jshint esversion:6
require('dotenv').config();
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findorCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose); //hash and salt passwords and save to db.
//userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});
userSchema.plugin(findorCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://www.localhost:3000/auth/google/callback",
    userProfileURL:"http://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function (req,res) { 
    res.render('home');
 });

 app.get("/auth/google",
 passport.authenticate('google', { scope: ['profile'] }));

 app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

 app.get('/login',function (req,res) { 
    res.render('login');
 });

 app.get('/register',function (req,res) { 
    res.render('register');
 });

 app.get('/secrets',function (req,res) { 
    User.find({'secret': {$ne: null} },function (err,foundUsers) { 
        if(err){
            console.log(err);
        }else{
            res.render('secrets', {usersWithSecrets: foundUsers});
        }
     });
 });

 app.get('/submit',function (req,res) { 
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }
 });


app.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



 
 app.post('/login', function(req,res){

    
    const usernames= req.body.username;
    const passwords= req.body.password;
    const user = new User({
        username: usernames,
        password: passwords
    });
    req.login(user, function (err)   { 
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,function () {  
                res.redirect('/secrets');
            });
        }
     });
    // User.findOne(
    //     {email:username},
    //     function(err,userFound){
    //     if(err){
    //         console.log('error: '+err);
    //         res.redirect('/');
    //     }else{
    //         bcrypt.compare(password, userFound.password, function(err, result) {
    //             if(result){
    //                 res.render('secrets'); 
    //             }else{
    //                 console.log('error comparing hash result: '+ err);
    //             }
    //         });
    //     }
    // });
 });

 app.post('/register', function(req,res){


    User.register({username: req.body.username}, req.body.password, function (err,user) {  
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,function () {  
                res.redirect('/secrets');
            });
        }
    });
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render('secrets');
    //         }
    //     });

    // });

    
 });


 app.post('/submit',function (req,res) { 
    const submittedSecret = req.body.secret;
    console.log(req.user);

    User.findById(req.user.id, function (err,foundUser) { 
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function () { 
                    res.redirect('/secrets')
                 });
            }
        }
     });

 });

app.listen(3000, function(req,res){
    console.log('server started at port 3000');
});








 
 
 

// Level 1 - Username and Password Only
//  Level 2 - Encryption
// Add Environment Vars
// Level 3 - Hashing with md5
// Level 4 - Hashing and Salting with bcrypt 
// Level 5 - Cookies and Sessions
// Level 6 - Google OAuth 2.0 Authentication



