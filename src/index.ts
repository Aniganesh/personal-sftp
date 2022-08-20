import passport from "passport";
import loginRoutes from "./routes/loginRoutes";
import fileRoutes from "./routes/fileRoutes";
import { RouteConfig } from "./types";
import app from "./init";
import homeRoutes from "./routes/homeRoutes";
import "./passport-config";

const allRoutes = [...loginRoutes, ...fileRoutes, ...homeRoutes];

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
      return passport.authenticate("local", { session: false });
  }
};

allRoutes.forEach(({ method, route, callbacks, authenticationMethod }) => {
  const authCallback = getAuthenticationCallback(authenticationMethod);
  if (authCallback) {
    if (Array.isArray(callbacks)) {
      callbacks.push(authCallback);
    } else {
      callbacks = [authCallback].concat(callbacks);
    }
  }
  console.log(`listening to ${method} requests on ${route}`);
  app[method](route, callbacks);
});
