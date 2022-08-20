import { RouteConfig } from "../types";
import JWT from "jsonwebtoken";
import { IUser } from "../Models/user";
import { AUTH_TOKEN_KEY } from "../constants";
import passport from "passport";

const loginScreenRoute: RouteConfig = {
  route: "/login",
  callbacks: (req, res) => {
    res.sendFile("login-screen.html", { root: "public" });
  },
  method: "get",
};
const loginEndpointRoute: RouteConfig = {
  route: "/login",
  authenticationMethod: "local",
  callbacks: [
    (req, res) => {
      const newJwt = JWT.sign(
        { name: (req.user as IUser)?._id, iat: Date.now() + 86400 },
        process.env.SECRET as string,
        {}
      );
      res.cookie(AUTH_TOKEN_KEY, newJwt);
      console.log({ processSetuid: process.setuid });
      // process.setuid?.(1001);
      res.redirect("/files");
    },
  ],
  method: "post",
};

export default [loginScreenRoute, loginEndpointRoute];
