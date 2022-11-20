import passport from "passport";
import loginRoutes from "./routes/loginRoutes";
import fileRoutes from "./routes/fileRoutes";
import { RouteConfig } from "./types";
import app from "./init";
import homeRoutes from "./routes/homeRoutes";
import "./passport-config";
import ipWebHook from "./routes/ipwebhook";

const allRoutes = [...loginRoutes, ...fileRoutes, ...homeRoutes, ...ipWebHook];

const getAuthenticationCallback = (
  type: RouteConfig["authenticationMethod"]
) => {
  switch (type) {
    case "jwt":
      return passport.authenticate("jwt", {
        session: false,
        failureRedirect: "/login",
      });
    case "local":
      // console.log("returning local auth callback", passport.authenticate("local", { session: false }));
      return passport.authenticate("local", { session: false });
    default:
      return;
  }
};

allRoutes.forEach(({ method, route, callbacks, authenticationMethod }) => {
  const authCallback = getAuthenticationCallback(authenticationMethod);
  if (authCallback) {
    if (Array.isArray(callbacks)) {
      callbacks.unshift(authCallback);
      // console.log({ callbacks });
    } else {
      callbacks = [authCallback].concat(callbacks);
    }
  }
  console.log(`listening to ${method} requests on ${route}`);
  app[method](route, callbacks);
});
// console.log({ currentUserId: process.getuid?.() });
