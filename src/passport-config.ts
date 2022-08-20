import { Request } from "express";
import bcrypt from "bcrypt";
import { Strategy as JwtStrategy, VerifiedCallback } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import UserModel, { IUser } from "./Models/user";
import { CallbackError } from "mongoose";
import passport from "passport";
import { AUTH_TOKEN_KEY } from "./constants";

const opts = {
  jwtFromRequest: (req: Request) => {
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
passport.use(
  new LocalStrategy(
    {
      passwordField: "password",
      usernameField: "username",
      session: false,
      passReqToCallback: false,
    },
    function (username, password, done) {
      UserModel.findOne<IUser>(
        { name: username },
        (err: CallbackError, user: IUser) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (bcrypt.compareSync(user.password, password)) {
            return done(null, false);
          }
          return done(null, user);
        }
      );
    }
  )
);
passport.use(
  new JwtStrategy(
    opts,
    (req: Request, jwt_payload: any, done: VerifiedCallback) => {
      UserModel.findOne(
        { id: jwt_payload.sub },
        function (err: CallbackError | null, user?: IUser | null) {
          if (err) {
            return done(err, false);
          }
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
            // or you could create a new account
          }
        }
      );
    }
  )
);
