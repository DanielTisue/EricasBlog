var express = require("express"),
    router  = express.Router({mergeParams: true}),
    Post = require("../models/post"),
    Comment = require("../models/comment"),
    middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    Post.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
        } else {
           res.render("comments/new", {post:post}); 
        }
    });
});

//create comment
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup post using ID
   Post.findById(req.params.id, function(err, post){
       if(err){
           console.log(err);
           res.redirect("/posts");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               comment.save();
               post.comments.push(comment);
               post.save();
               req.flash("success", "Comment Successfully Created!");
               res.redirect('/posts/' + post._id);
           }
        });
       }
   });
});

//COMMENT EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
          res.redirect("back");
      } else {
        res.render("comments/edit", {post_id: req.params.id, comment: foundComment});
      }
   });
});


//COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          console.log(err);
          res.render("edit");
      } else {
          res.redirect("/posts/" + req.params.id);
      }
  }); 
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comment Successfully Deleted!");
           res.redirect("/posts/" + req.params.id);
       }
    });
});

module.exports = router;