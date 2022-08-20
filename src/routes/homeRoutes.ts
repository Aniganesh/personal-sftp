import { RouteConfig } from "../types";

const homeRoute: RouteConfig = {
  method: "get",
  route: "/",
  authenticationMethod: "jwt",
  callbacks: (_, res) => {
    res.redirect("/files");
  },
};

export default [homeRoute];
