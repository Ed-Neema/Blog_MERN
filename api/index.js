const express = require("express");
const app = express();
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const Post = require("./models/Post");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
require("dotenv").config();

// password harshing
const salt = bcrypt.genSaltSync(10);
const secret = "rturovrwfisncwurqaglriughal";

app.use(cors({ credentials: true, origin: "http://localhost:3000" })); //adds the CORS middleware to the Express application, allowing cross-origin requests from any origin.
app.use(express.json());
/**
 * When a client sends a request with a JSON payload, the express.json() middleware
 * parses the JSON data and makes it available in the req.body property of the
 * request object.
 * This allows you to easily access and work with the JSON data in your route
 * handlers.
 */
app.use(cookieParser());

// connect to mongoose
mongoose.connect(
  process.env.MONGO_DB
);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  //   returns newly created user document
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // check password
  // grab the userDoc with the given username
  const userDoc = await User.findOne({ username: username });
  // compare passwords: from our request vs from db
  const passOk = bcrypt.compareSync(password, userDoc.password);
  //   res.json(passOk); //returns either true or false
  if (passOk) {
    // logged in
    // payload, secret
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      // set the token to our token
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
    // res.json()
  } else {
    res.status(400).json("wrong credentials");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
  res.json(req.cookies);
});

app.post("/post", uploadMiddleware.single("file"), (req, res) => {
  // changing the filename
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);
  // save to uploads directory
  // grab the files from the request

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});

app.get("/post", async (req, res) => {
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.post("/logout", (req, res) => {
  // set the token to an empty string
  res.cookie("token", "").json("ok");
});
app.listen(4000);
