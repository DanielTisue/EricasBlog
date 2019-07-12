var express = require("express");
var router  = express.Router();
var Post = require("../models/post");
var middleware = require("../middleware");




//Show all posts
router.get("/", function(req, res){
  Post.find({}, function(err, allPosts){
        if(err){
            console.log(err);
        } else {
             res.render("posts/posts", {posts: allPosts}); 
        }
    });
 });

//CREATE - add new post to DB
router.post("/", middleware.isAdmin, function(req, res){
    // get data from form and add to posts array
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username,
    };
    var newPost = {name: name, image: image, description: description, author:author};
    //create new post
    Post.create(newPost, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            req.flash("success", "Blog post Successfully Created!");
            return res.redirect("/posts");
        }
    });
});


//NEW 
router.get("/new", middleware.isAdmin, function(req, res){
   res.render("posts/new"); 
});

// SHOW - shows more info about one post
router.get("/:id", function(req, res){
    //find the post with provided ID
    Post.findById(req.params.id).populate("comments").exec(function(err, foundPost){
        if(err){
            console.log(err);
        } else {
            console.log(foundPost);
            //render show template with that post
            res.render("posts/show", {post: foundPost});
        }
    });
});

// EDIT POST ROUTE
router.get("/:id/edit", middleware.isAdmin, function(req, res){
    Post.findById(req.params.id, function(err, foundPost){
        if(err){
            console.log(err);
        }
        res.render("posts/edit", {post: foundPost});
    });
});

// UPDATE POST ROUTE
router.put("/:id", middleware.isAdmin, function(req, res){
    // find and update the correct post
    Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatedPost){
      if(err){
          res.redirect("/posts");
      } else {
          //redirect somewhere(show page)
          res.redirect("/posts/" + req.params.id);
      }
    });
});

// DESTROY POST ROUTE
router.delete("/:id", middleware.isAdmin, function(req, res){
   Post.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/posts");
      } else {
          req.flash("success", "Blog post Successfully Deleted!");
          res.redirect("/posts");
      }
   });
});

module.exports = router;