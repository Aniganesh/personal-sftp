import fsExtra from "fs-extra";
import { NextFunction, Request, Response } from "express-serve-static-core";
import formidable, { File } from "formidable";
import { RouteConfig } from "../types";
import handlebars from "handlebars";

const deleteFileEndpoint: RouteConfig = {
  route: "/delete",
  method: "post",
  authenticationMethod: "jwt",
  callbacks: [
    (req: Request, res: Response, next: NextFunction) => {
      res.sendStatus(200);
      return;
      const { deletePath } = req.body;
      if (fsExtra.pathExistsSync(deletePath)) {
        fsExtra.rmSync(deletePath, { recursive: true });
        res.sendStatus(204);
      }
    },
  ],
};

const uploadFileEndpoint: RouteConfig = {
  method: "post",
  route: "/upload",
  authenticationMethod: "jwt",
  callbacks: [
    async (req, res) => {
      const form = new formidable.IncomingForm();
      const files: File[] = [];
      const fields: Record<string, string> = {};
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
    },
  ],
};
interface FileInfo {
  name: string;
  filePath: string;
  isFile: boolean;
  pathToRedirect: string;
}
const getFilesEndpoint: RouteConfig = {
  method: "get",
  route: "/files",
  authenticationMethod: "jwt",
  callbacks: (req, res) => {
    const currentPath: string = (req.query.path ?? "/") as string;
    if (fsExtra.pathExistsSync(currentPath)) {
      if (fsExtra.lstatSync(currentPath).isDirectory()) {
        const allFiles = fsExtra.readdirSync(`${currentPath}`, {
          withFileTypes: true,
        });
        const OPTemplate = fsExtra
          .readFileSync(
            __dirname.split("/").slice(0, -1).join("/") +
              "/public/template.handlebars"
          )
          .toString();
        const folders: FileInfo[] = [],
          files: FileInfo[] = [];
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
  },
};

const renameFileEndpoint: RouteConfig = {
  method: "patch",
  route: "/rename",
  authenticationMethod: "jwt",
  callbacks: (req, res) => {
    const { renamePath, newPath } = req.body;
    fsExtra.renameSync(renamePath, newPath);
    res.sendStatus(200);
  },
};

export default [
  deleteFileEndpoint,
  uploadFileEndpoint,
  getFilesEndpoint,
  renameFileEndpoint,
];
