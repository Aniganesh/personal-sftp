const mongoose = require("mongoose");
const defaultUsers = require("./defaultUsers.json");
const UserModel = require("./Models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect("mongodb://localhost:27017/sftp");

UserModel.deleteMany().then(() => {
  defaultUsers.forEach(async (user) => {
    const password = bcrypt.hashSync(user.password, process.env.SALT);
    const _user = new UserModel({ ...user, password });
    await _user.save();
    console.log(`Added user`, _user);
  });
});
