import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import { queryParser } from "express-query-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

mongoose.connect(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/sftp?authSource=admin`
);

const PORT = 3000;

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

function cookieParser(req: Request, res: Response, next: NextFunction) {
  var cookies = req.headers.cookie;
  if (cookies) {
    req.cookies = cookies.split(";").reduce((obj: Record<string, any>, c) => {
      var n = c.split("=");
      obj[n[0].trim()] = n[1].trim();
      return obj;
    }, {});
  }
  next();
}

app.use(cookieParser);

app.listen(PORT);

export default app;
