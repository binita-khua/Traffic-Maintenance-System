const express = require("express");
const { check, validationResult } = require("express-validator");
const path = require("path");
const fileUpload = require("express-fileupload");
const session = require("express-session");

const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1/MyWebsite", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Reporter = mongoose.model("Reporters", {
  username: String,
  password: String,
});

const Ticket = mongoose.model("Tickets", {
  name: String,
  phone: String,
  description: String,
  imageName: String,
});

const regexPhone = /^[0-9]{3}\-[0-9]{3}\-[0-9]{4}$/;

var myApp = express();
myApp.use(express.urlencoded({ extended: false }));

myApp.set("views", path.join(__dirname, "views"));
myApp.use(express.static(__dirname + "/public"));
myApp.set("view engine", "ejs");

myApp.use(express.urlencoded({ extended: false }));

myApp.use(fileUpload());
myApp.use(
  session({
    secret: "seceretkeyforbrksprojecofwebdevanddesign123457",
    resave: false,
    saveUninitialised: true,
  })
);

myApp.use((req, res, next) => {
  const isLoggedIn = req.session.loggedIn || false;
  res.locals.isLoggedIn = isLoggedIn;
  next();
});

myApp.get("/", function (req, res) {
  res.render("add");
});

myApp.get("/login", function (req, res) {
  res.render("login");
});

myApp.get("/dashboard", function (req, res) {
  Ticket.find({}).exec(function (err, mytickets) {
    var pageData = {
      mytickets: mytickets,
    };
    res.render("dashboard",pageData);
  });
});


myApp.get("/logout", function (req, res) {
  req.session.username = "";
  req.session.loggedIn = false;
  res.redirect("/login");
});

const regexValidation = (value, regex) => {
  return regex.test(value) ? true : false;
};

const phoneValidation = (value) => {
  if (!regexValidation(value, regexPhone)) {
    throw new Error("Phone should be in format xxx-xxx-xxxx| ");
  }

  return true;
};

myApp.post(
  "/add",
  [
    check("name", "Must have a Name| ").not().isEmpty(),
    check("phone", "Must have a Phone| ").custom(phoneValidation),
    check("description", "Must have a Description").not().isEmpty(),
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add", {
        errors: errors.array(),
      });
    } else {
      let name = req.body.name;
      let phone = req.body.phone;
      let description = req.body.description;
      var imageName = req.files.myimage.name;
      var imageFile = req.files.myimage;
      var imagePath = "public/uploads/" + imageName;
      imageFile.mv(imagePath, function (err) {
        console.log(err);
      });
      var pageData = {
        name,
        phone,
        description,
        imageName,
      };
      var myTicket = new Ticket(pageData);
      myTicket.save();
      res.render("addsuccess", {
        name,
        phone,
        description,
        imageName,
      });
    }
  }
);

myApp.post("/login", function (req, res) {
  let username = req.body.username;
  let password = req.body.password;
  var adminpagedata = {
    username,
    password,
  };
  var myAdmin = new Reporter(adminpagedata);
  myAdmin.save();
  Ticket.find({}).exec(function (err, mytickets) {
    var pageData = {
      mytickets: mytickets,
    };
    res.render("dashboard", pageData);
  });
});

myApp.get("/view/:id", async (req, res) => {
  let TicketId = req.params.id;
  const ticket = await Ticket.findOne({ _id: TicketId }).exec();
  res.render("view", { ticket });
});

myApp.get("/edit/:id", async (req, res) => {
  let TicketId = req.params.id;
  const ticket = await Ticket.findOne({ _id: TicketId }).exec();
  res.render("edit", { ticket });
});

myApp.post("/edit/:id", async (req, res) => {
  let TicketId = req.params.id;
  let name = req.body.name;
  let phone = req.body.phone;
  let description = req.body.description;
  let imageName = req.body.imageName;

  await Ticket.updateOne(
    { _id: TicketId },
    { name, phone, description, imageName },
    { new: true }
  ).exec();

  res.render("editsuccess");
});

myApp.get("/deletesuccess/:id", async (req, res) => {
  let id = req.params.id;
  await Ticket.findByIdAndRemove({ _id: id }).exec();

  res.render("deletesuccess");
});

myApp.listen(8080);

console.log("Successfully Running on port 8080....");
