import { RequestHandler } from "express";
import { IUser } from "../Models/user";

export const allowOnlyOwnFileManip: RequestHandler = (req, res, next) => {
  const currentPath = req.query.path ?? "";
  if (!currentPath || typeof currentPath !== "string") next();
  if (currentPath) {
    const username = (req.user as IUser).name.toLowerCase();
    if (
      typeof currentPath === "string" &&
      currentPath.indexOf(`/home/${username}`) === 0
    ) {
      next();
    } else if (typeof currentPath === "string") {
      res.status(403).json({
        message: "You're not allowed to view/manipulate this(these) file(s)",
      });
    }
  }
};
