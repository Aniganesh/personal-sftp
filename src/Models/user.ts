import { model, Schema } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  password: string;
}

export const User = model<IUser>(
  "User",
  new Schema<IUser>({
    name: String,
    password: String,
  })
);

export default User;
