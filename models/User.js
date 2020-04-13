const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    username: String,
    email: String,
    password: String,
    posts: Number
});

const userModel = model('User', userSchema);

module.exports = userModel;