require('dotenv').config();
var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");


router.get("/", function(req, res){
    res.render("landing2");
});

router.get("/about", function(req, res){
    res.render("about");
});

//Show the Register Form
router.get("/register", function(req, res){
   res.render("register"); 
});

// REGISTER (SIGN UP) LOGIC
router.post("/register", function(req, res){
    var newUser = new User(
        {
            username: req.body.username, 
            // firstName: req.body.firstName, 
            // lastName: req.body.lastName, 
            email: req.body.email, 
           
            
        });
    if(req.body.adminCode === process.env.ADMIN_CODE) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
                req.flash("error", err.message);
                return res.redirect("/register");
                }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Texas Living " + user.username);
            return res.redirect("/posts");
        });
    });
});

//Show Login Form
router.get("/login", function(req,res){
    res.render("login");
    
});

//Login Logic
router.post("/login", passport.authenticate("local", 
        {
            successRedirect: "/posts",
            failureRedirect: "/login",
            failureFlash: true,
            successFlash: "Welcome to Texas Living"
        }), function(req,res){
});

//LOGOUT logic route
router.get("/logout", function(req, res) {
  req.logout();
  req.flash("success", "Successfully Logged Out!");
  res.redirect("/posts");
});
//
// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'ericamauriciotexasliving@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'TexasLivingEricasWay',
        subject: 'Texas Living Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (err){ 
    req.flash('error', err.message);
    res.redirect('/forgot');
    }
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
              req.logIn(user, function(err) {
                if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'ericamauriciotexasliving@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'TexasLivingEricasWay@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    if (err){ 
    req.flash('error', err.message);
    return res.redirect('back');
        }
    res.redirect('/posts');
  });
});



module.exports = router;