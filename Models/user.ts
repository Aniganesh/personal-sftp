import { model, Schema } from "mongoose";

export interface IUser {
  name: string;
  password: string;
}

const User = model<IUser>(
  "User",
  new Schema<IUser>({
    name: String,
    password: String,
  })
);

export default User;
