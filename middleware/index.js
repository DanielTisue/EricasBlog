var Post = require("../models/post");
var Comment = require("../models/comment");
var User = require("../models/user");

//all middleware goes here
var middleware = {};

// middleware.checkPostOwnership = function(req, res, next){
//      if(req.isAuthenticated() && req.user.isAdmin){
//         Post.findById(req.params.id, function(err, foundPost){
//           if(err || !foundPost){
//               req.flash("error", "Blog post not found!");
//               res.redirect("back");
//           }  else {
//               // does user own the Post?
//             if(foundPost.author.id.equals(req.user._id) || req.user.isAdmin) {
//                 next();
//             } else {
//                 req.flash("error", "You dont have permission to do that!");
//                 res.redirect("back");
//             }
//           }
//         });
//     } else {
//         req.flash("error", "You need to be Logged In!");
//         res.redirect("back");
//     }
// };

middleware.checkCommentOwnership = function(req, res, next){
     if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
              req.flash("error", "You need to be Logged In!");
               res.redirect("back");
           }  else {
               // does user own the comment or isAdmin?
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "You dont have Permission!");
                res.redirect("back");
            }
           }
        });
    } else {
        res.redirect("back");
    }
};

 middleware.isAdmin = function(req, res, next) {
    if(req.isAuthenticated() && req.user.isAdmin) {
      next();
    } else {
      req.flash('error', "You dont have Permission!");
      res.redirect('back');
    }
  };
  
  middleware.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please Log In or Sign Up First");
    res.redirect("/login");
};
 //POSSIBLE ADMIN VERIFICATION?
//  router.post('/login', requireAdmin(), passport.authenticate('local'), function(req, res) {
//   res.redirect('/');
// });
 
//   function requireAdmin() {
//   return function(req, res, next) {
//     User.findOne({ req.body.username }, function(err, user) {
//       if (err) { return next(err); }

//       if (!user) { 
//         // Do something - the user does not exist
//       }

//       if (!user.admin) { 
//         // Do something - the user exists but is no admin user
//       }

//       // Hand over control to passport
//       next();
//     });
//   }
// }

module.exports = middleware;