const mongoose = require("mongoose");
const defaultUsers = require("./defaultUsers.json");
const UserModel = require("./Models/user");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/sftp?authSource=admin`
);

UserModel.deleteMany().then(() => {
  defaultUsers.forEach(async (user) => {
    const password = bcrypt.hashSync(user.password, process.env.SALT);
    const _user = new UserModel({ ...user, password });
    await _user.save();
    console.log(`Added user`, _user);
  });
});
