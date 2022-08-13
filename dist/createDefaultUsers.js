"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const defaultUsers_json_1 = __importDefault(require("./defaultUsers.json"));
const user_1 = __importDefault(require("./Models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
mongoose_1.default.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/sftp?authSource=admin`);
user_1.default.deleteMany().then(() => {
    defaultUsers_json_1.default.forEach(async (user) => {
        const password = bcrypt_1.default.hashSync(user.password, process.env.SALT);
        const _user = new user_1.default({ ...user, password });
        await _user.save();
        console.log(`Added user`, _user);
    });
});
