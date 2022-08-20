import { RequestHandler } from "express";
import QueryString from "qs";
type SingleRequestHandler = RequestHandler<
  {},
  any,
  any,
  QueryString.ParsedQs,
  Record<string, any>
>;
type Method =
  | "all"
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head";
export interface RouteConfig {
  callbacks: SingleRequestHandler | Array<SingleRequestHandler>;
  method: Method;
  route: string;
  authenticationMethod?: "jwt" | "local";
}
