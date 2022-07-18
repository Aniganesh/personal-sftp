const express = require("express");
const fsExtra = require("fs-extra");
const handlebars = require("handlebars");
const formidable = require("formidable");
const { queryParser } = require("express-query-parser");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(
  queryParser({
    parseNull: false,
    parseBoolean: false,
    parseNumber: false,
    parseUndefined: false,
  })
);
const PORT = 3000;

app.post("/delete", (req, res) => {
  const { deletePath } = req.body;
  if (fsExtra.pathExistsSync(deletePath)) {
    fsExtra.rmSync(deletePath, { recursive: true });
    res.sendStatus(204);
  }
});

app.post("/upload", async (req, res) => {
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
});

app.get("/files", (req, res) => {
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
});

app.listen(PORT);

app.patch("/rename", (req, res) => {
  res.sendStatus(200);
});
