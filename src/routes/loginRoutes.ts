import { RouteConfig } from "../types";
import JWT from "jsonwebtoken";
import { IUser } from "../Models/user";
import { AUTH_TOKEN_KEY } from "../constants";
import process from "node:process";

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
    async (req, res) => {
      const newJwt = JWT.sign(
        { name: (req.user as IUser)?._id, iat: Date.now() + 86400 },
        process.env.SECRET as string,
        {}
      );
      res.cookie(AUTH_TOKEN_KEY, newJwt);
      console.log({ currentUserId: process.getuid?.() });
      // process.setuid?.((req.user as IUser).name as string);
      // console.log({ processSetuid: process.setuid });
      // process.setuid?.(1001);
      res.redirect("/files");
    },
  ],
  method: "post",
};

export default [loginScreenRoute, loginEndpointRoute];
