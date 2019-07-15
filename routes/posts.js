var express = require("express");
var router = express.Router({ mergeParams: true });
var Post = require("../models/post");
var middleware = require("../middleware");


// Multer + Cloudinary Config

const crypto = require("crypto");
const multer = require("multer");
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const cloudinaryStorage = require("multer-storage-cloudinary");
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "Ericas Blog",
  allowedFormats: ["jpeg", "jpg", "png"],
  filename: function(req, file, cb) {
    let buf = crypto.randomBytes(16);
    buf = buf.toString("hex");
    let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/gi, "");
    uniqFileName += buf;
    cb(undefined, uniqFileName);
  }
});
const upload = multer({ storage });


//Show all posts
router.get("/", function(req, res){
  var perPage = 8,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1;
  Post.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec( function(err, allPosts){
      Post.count().exec(function(err, count) {
        if (err) {
          console.log(err);
        } else {
          res.render("posts/posts", { 
            posts: allPosts, 
            current: pageNumber,
            pages: Math.ceil(count / perPage)
          });
        }
      });
    });
 });

//CREATE - add new post to DB
router.post("/", middleware.isAdmin, upload.single("image"), function(req, res){
    // set image req.
   req.body.image = {
     url: req.file.secure_url,
     public_id: req.file.public_id
   };
   req.body.createdAt = {
       type: Date,
       default: Date.now
   }
    // get data from form and add to posts array
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username,
    };
    var date = req.body.createdAt;
    var newPost = {name: name, image: image, description: description, date: date, author:author};
    //create new post
    Post.create(newPost, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            console.log(newlyCreated);
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
            req.flash("error", err.message );
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
            res.redirect("/posts")
        }
        res.render("posts/edit", {post: foundPost});
    });
});

// UPDATE POST ROUTE
router.put("/:id", middleware.isAdmin, upload.single("image"), function(req, res){
    // find and update the correct post
    Post.findByIdAndUpdate(req.params.id, req.body.post, async function(err, post){
      if(err){
          console.log(err);
          req.flash("error", "Something went wrong:" + err.message);
          res.redirect("/posts");
      } else {
           if (req.file) {
             try {
               await cloudinary.v2.uploader.destroy(post.image.public_id);
               post.image.public_id = req.file.public_id;
               post.image.url = req.file.secure_url;
               await post.save();
             } catch (err) {
                 console.log(err);
               return res.redirect("back");
             }
           }
           //console.log(updatedPost);
           req.flash("success", "Post successfully updated!");
          //redirect somewhere(show page)
          res.redirect("/posts/" + req.params.id);
      }
    });
});

// DESTROY POST ROUTE
router.delete("/:id", middleware.isAdmin, function(req, res){
   Post.findById(req.params.id, async function(err, post){
      if(err) {
          req.flash("error", "UH OH...Something went wrong:" + err.message);
          res.redirect("/posts");
      } else {
          try{ 
              await cloudinary.v2.uploader.destroy(post.image.public_id);
            await post.remove();
          } catch(err) {
            console.log(err);
            return res.redirect("back");
          }  
            req.flash("success", "Blog Post Successfully Deleted!");
            res.redirect("/posts");
          }
      });
   });


module.exports = router;