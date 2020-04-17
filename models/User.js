const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    username: String,
    email: String,
    password: String,
    posts: Number,
    refreshToken: String
});

const userModel = model('User', userSchema);

module.exports = userModel;