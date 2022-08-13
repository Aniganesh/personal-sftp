import mongoose from "mongoose";
import defaultUsers from "./defaultUsers.json";
import UserModel from "./Models/user";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/sftp?authSource=admin`
);

UserModel.deleteMany().then(() => {
  defaultUsers.forEach(async (user) => {
    const password = bcrypt.hashSync(user.password, process.env.SALT as string);
    const _user = new UserModel({ ...user, password });
    await _user.save();
    console.log(`Added user`, _user);
  });
});
