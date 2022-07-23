//jshint esversion:6
require('env').config();
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// const secret = "Thisisourlittlesecret";
//access by process.env.SECRET
userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);


app.get('/',function (req,res) { 
    res.render('home');
 });

 app.get('/login',function (req,res) { 
    res.render('login');
 });

 app.get('/register',function (req,res) { 
    res.render('register');
 });

 
 app.post('/login', function(req,res){
    const username= req.body.username;
    const password= req.body.password;
    User.findOne(
        {email:username},
        function(err,userFound){
        if(err){
            console.log('error: '+err);
            res.redirect('/');
        }else{
            if(password === userFound.password){
                res.render('secrets');
            }else{
                res.send('password incorrect');
                res.redirect('/');
            }

        }
    });
 });

 app.post('/register', function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render('secrets');
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



