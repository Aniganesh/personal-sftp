"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const formidable_1 = __importDefault(require("formidable"));
const express_query_parser_1 = require("express-query-parser");
const passport_1 = __importDefault(require("passport"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_jwt_1 = require("passport-jwt");
const passport_local_1 = require("passport-local");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const user_1 = __importDefault(require("./Models/user"));
const JWT = require("jsonwebtoken");
const AUTH_TOKEN_KEY = "authToken";
dotenv_1.default.config();
mongoose_1.default.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/sftp?authSource=admin`);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static("public"));
app.use(body_parser_1.default.json({ strict: true }));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, express_query_parser_1.queryParser)({
    parseNull: false,
    parseBoolean: false,
    parseNumber: false,
    parseUndefined: false,
}));
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
app.post("/delete", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => {
    res.sendStatus(200);
    return;
    const { deletePath } = req.body;
    if (fs_extra_1.default.pathExistsSync(deletePath)) {
        fs_extra_1.default.rmSync(deletePath, { recursive: true });
        res.sendStatus(204);
    }
});
app.post("/upload", passport_1.default.authenticate("jwt", { session: false }), async (req, res) => {
    const form = new formidable_1.default.IncomingForm();
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
            fs_extra_1.default.renameSync(oldPath, newPath);
            console.log(`Saved file ${newPath}`);
            saveCompletedFileCount++;
            if (index === files.length - 1) {
                if (saveCompletedFileCount === files.length) {
                    res.redirect(fields.filepath);
                }
                else {
                    res.sendStatus(207);
                }
            }
        });
    });
    let saveCompletedFileCount = 0;
});
app.get("/files", passport_1.default.authenticate("jwt", { failureRedirect: "/login", session: false }), (req, res) => {
    const currentPath = (req.query.path ?? "/");
    if (fs_extra_1.default.pathExistsSync(currentPath)) {
        if (fs_extra_1.default.lstatSync(currentPath).isDirectory()) {
            const allFiles = fs_extra_1.default.readdirSync(`${currentPath}`, {
                withFileTypes: true,
            });
            const OPTemplate = fs_extra_1.default
                .readFileSync(__dirname.split("/").slice(0, -1).join("/") +
                "/public/template.handlebars")
                .toString();
            const folders = [], files = [];
            allFiles.forEach(({ name }) => {
                const filePath = `${currentPath === "/" ? currentPath : `${currentPath}/`}${name}`;
                if (fs_extra_1.default.lstatSync(filePath).isFile())
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
            const op = handlebars_1.default.compile(OPTemplate)(handlebarsTemplateData);
            res.send(op);
        }
        else {
            const file = fs_extra_1.default.readFileSync(currentPath);
            res.send(file);
        }
    }
    else {
        res.send("That path does not exist.");
    }
});
app.patch("/rename", passport_1.default.authenticate("jwt", { session: false }), (req, res) => {
    const { renamePath, newPath } = req.body;
    fs_extra_1.default.renameSync(renamePath, newPath);
    res.sendStatus(200);
});
app.get("/login", (req, res) => {
    res.sendFile("login-screen.html", { root: "public" });
});
app.post("/login", passport_1.default.authenticate("local", { session: false }), (req, res) => {
    const newJwt = JWT.sign({ name: req.user?._id, iat: Date.now() + 86400 }, process.env.SECRET, {});
    res.cookie(AUTH_TOKEN_KEY, newJwt);
    res.redirect("/files");
});
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
passport_1.default.use(new passport_local_1.Strategy({
    passwordField: "password",
    usernameField: "username",
    session: false,
    passReqToCallback: false,
}, function (username, password, done) {
    user_1.default.findOne({ name: username }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }
        if (bcrypt_1.default.compareSync(user.password, password)) {
            return done(null, false);
        }
        return done(null, user);
    });
}));
passport_1.default.use(new passport_jwt_1.Strategy(opts, (req, jwt_payload, done) => {
    user_1.default.findOne({ id: jwt_payload.sub }, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
            // or you could create a new account
        }
    });
}));
app.get("/", passport_1.default.authenticate("jwt", { failureRedirect: "/login", session: false }), (_, res) => {
    res.redirect("/files");
});
app.listen(PORT);
