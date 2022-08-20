import { model, Schema } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  password: string;
  uid?: string | number;
}

export const User = model<IUser>(
  "User",
  new Schema<IUser>({
    name: String,
    password: String,
    uid: String,
  })
);

export default User;
