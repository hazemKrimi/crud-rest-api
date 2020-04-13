const { Schema, model } = require('mongoose');

const postSchema = new Schema({
    title: String,
    content: String,
    author: String
});

const postModel = model('Post', postSchema);

module.exports = postModel;