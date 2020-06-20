var db = require("../models");

module.exports = function(app) {
  // Load index page
  app.get("/", function(req, res) {
    // db.Streamline.findAll({}).then(function(dbStreamline) {
    //     var examples = {
    //         movies: dbStreamline
    //     }
      // res.render("index", examples);
      res.render("index")
    });
  // });
  // app.get("/", function(req, res) {
  //   res.render("index", {
  //     layout: 'main'
  //   });
  // });
  // app.get("/login", function(req, res) {
  //   res.render("login", {
  //     layout: 'main'
  //   });
  // });
  app.get("/newuser", function(req, res) {
    res.render("newuser", {
      layout: 'main'
    });
  });
  
  app.get("/logout", function(req, res) {
    res.render("logout", {
      layout: 'main'
    });
  });

  app.get("/home", function(req, res) {
    db.Streamline.findAll({}).then(function(dbStreamline) {
      res.render("home", {
        msg: "Welcome!",
        examples: dbStreamline
      });
    });
  });

  app.get("/testing", function(req, res) {
    db.Streamline.findAll({}).then(function(dbStreamline) {
      res.render("dbtesting", {
        msg: "Welcome!",
        examples: dbStreamline
      });
    });
  });

  app.get("/stream", function(req, res) {
    db.Streamline.findAll({}).then(function(dbStreamline) {
          var examples = {
              movies: dbStreamline
          }
      res.render("stream", examples);
  });
  });
  // Load example page and pass in an example by id
  app.get("/stream/:id", function(req, res) {
      db.Users.findOne({
        where: {
          id: req.params.id
        }
      }).then(function(data) {
        db.Streamline.findAll({
          where: {
            UserId: req.params.id
          }
        }).then(function(data) {
          console.log(data);
          var examples = {
              movies: data,
          }
          res.render("stream", examples);

        })
      
      })
  });

  // Render 404 page for any unmatched routes
  app.get("*", function(req, res) {
    res.render("404");
  });
};
