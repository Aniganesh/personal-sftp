const express = require("express");
const fsExtra = require("fs-extra");
const handlebars = require("handlebars");
const formidable = require("formidable");
const { queryParser } = require("express-query-parser");
const passport = require("passport");
const bcrypt = require("bcrypt");
const JwtStrategy = require("passport-jwt").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const UserModel = require("./Models/user");
const JWT = require("jsonwebtoken");
const AUTH_TOKEN_KEY = "authToken";

mongoose.connect("mongodb://localhost:27017/sftp");
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.json({ strict: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  queryParser({
    parseNull: false,
    parseBoolean: false,
    parseNumber: false,
    parseUndefined: false,
  })
);

function cookieParser(req, res, next) {
  var cookies = req.headers.cookie;
  if (cookies) {
    req.cookies = cookies.split(";").reduce((obj, c) => {
      var n = c.split("=");
      obj[n[0].trim()] = n[1].trim();
      return obj;
    }, {});
  }
  next();
}

app.use(cookieParser);

const PORT = 3000;

app.post(
  "/delete",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.sendStatus(200);
    return;
    const { deletePath } = req.body;
    if (fsExtra.pathExistsSync(deletePath)) {
      fsExtra.rmSync(deletePath, { recursive: true });
      res.sendStatus(204);
    }
  }
);

app.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const form = new formidable.IncomingForm();
    const files = [];
    const fields = {};
    form.on("file", (fieldName, file) => {
      files.push(file);
    });
    form.on("field", (name, value) => {
      fields[name] = value;
    });
    form.parse(req, () => {
      files.forEach((file, index) => {
        const oldPath = file.filepath;
        const newPath = `${fields.filepath}/${file.originalFilename}`;
        fsExtra.renameSync(oldPath, newPath);
        console.log(`Saved file ${newPath}`);
        saveCompletedFileCount++;
        if (index === files.length - 1) {
          if (saveCompletedFileCount === files.length) {
            res.redirect(fields.filepath);
          } else {
            res.sendStatus(207);
          }
        }
      });
    });
    let saveCompletedFileCount = 0;
  }
);

app.get(
  "/files",
  passport.authenticate("jwt", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const currentPath = req.query.path ?? "/";
    if (fsExtra.pathExistsSync(currentPath)) {
      if (fsExtra.lstatSync(currentPath).isDirectory()) {
        const allFiles = fsExtra.readdirSync(`${currentPath}`, {
          withFileTypes: true,
        });
        const OPTemplate = fsExtra
          .readFileSync("./template.handlebars")
          .toString();
        const folders = [],
          files = [];
        allFiles.forEach(({ name }) => {
          const filePath = `${
            currentPath === "/" ? currentPath : `${currentPath}/`
          }${name}`;
          if (fsExtra.lstatSync(filePath).isFile())
            files.push({
              name,
              filePath,
              pathToRedirect: `/files?path=${filePath}`,
              isFile: true,
            });
          else
            folders.push({
              name,
              filePath,
              pathToRedirect: `/files?path=${filePath}`,
              isFile: false,
            });
        });
        const handlebarsTemplateData = {
          files: folders.concat(files),
        };
        const op = handlebars.compile(OPTemplate)(handlebarsTemplateData);
        res.send(op);
      } else {
        const file = fsExtra.readFileSync(currentPath);
        res.send(file);
      }
    } else {
      res.send("That path does not exist.");
    }
  }
);

app.patch(
  "/rename",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { renamePath, newPath } = req.body;
    fsExtra.renameSync(renamePath, newPath);
    res.sendStatus(200);
  }
);

app.get("/login", (req, res) => {
  res.send(fsExtra.readFileSync("./login-screen.html").toString());
});

app.post(
  "/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    const newJwt = JWT.sign(
      { name: "Aniruddha", iat: 1516239022 },
      process.env.SECRET,
      {}
    );
    res.cookie(AUTH_TOKEN_KEY, newJwt);
    res.redirect("/files");
  }
);

const opts = {
  jwtFromRequest: (req) => {
    if (req && req.cookies) {
      return req.cookies[AUTH_TOKEN_KEY];
    }
    return null;
  },
  secretOrKey: process.env.SECRET,
  passReqToCallback: true,
  // issuer: process.env.APP_URL,
  // audience: process.env.TOP_DOMAIN_URL,
};
passport.use(
  new LocalStrategy(
    {
      passwordField: "password",
      usernameField: "username",
      session: false,
      passReqToCallback: false,
    },
    function (username, password, done) {
      UserModel.findOne({ name: username }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (bcrypt.compareSync(user.password, password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    }
  )
);
passport.use(
  new JwtStrategy(opts, (req, jwt_payload, done) => {
    UserModel.findOne({ id: jwt_payload.sub }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
        // or you could create a new account
      }
    });
  })
);

app.get(
  "/",
  passport.authenticate("jwt", { failureRedirect: "/login", session: false }),
  (_, res) => {
    res.redirect("/files");
  }
);

app.listen(PORT);
