const User = require('../../models/User');
const Post = require('../../models/Post');

module.exports = {
    posts: async() => {
        try {
            const posts = await Post.find();
            if (!posts) throw new Error('Error getting posts');
            if (posts.length === 0) throw new Error('No posts found');
            return posts.map(post => ({ ...post._doc }));
        } catch(err) {
            throw err;
        }
    },
    post: async({ id }) => {
        try {
            if (!id) throw new Error('Missing post data');
            const post = await Post.findById(id);
            if (!post) throw new Error('No post found');
            return { ...post._doc };
        } catch(err) {
            throw err;
        }
    },
    createPost: async({ title, content }, req) => {
        try {
            if (!req.authenticated) throw new Error('No logged in user');
            if (!title || !content) throw new Error('Missing post data');
            const post = new Post({ title, content, author: req.user.username });
            const user = await User.findOne({ username: req.user.username });
            if (!user) throw new Error('Error creating post');
            user.posts++;
            await user.save();
            await post.save();
            return { ...post._doc };
        } catch(err) {
            throw err;
        }
    },
    updatePost: async({ id, title, content }, req) => {
        try {
            if (!req.authenticated) throw new Error('No logged in user');
            if (!id) throw new Error('Missing post data');
            if (!title && !content) throw new Error('Missing post data');
            const post = await Post.findById(id);
            if (!post) throw new Error('No post found');
            if (post.author !== req.user.username) throw new Error('This user can\'t update this post');
            if (title) post.title = title;
            if (content) post.content = content;
            await post.save();
            return { ...post._doc };
        } catch(err) {
            throw err;
        }
    },
    deletePost: async({ id }, req) => {
        try {
            if (!req.authenticated) throw new Error('No logged in user');
            if (!id) throw new Error('Missing post data');
            const post = await Post.findById(id);
            if (!post) throw new Error('No post found');
            if (post.author !== req.user.username) throw new Error('This user can\'t delete this post');
            else {
                const user = await User.findOne({ username: req.user.username });
                if (!user) throw new Error('Error deleting post');
                user.posts--;
                await user.save();
                const post = await Post.findByIdAndRemove(id);
                if (!post) throw new Error('Error deleting post');
                return { ...post._doc };
            }
        } catch(err) {
            throw err;
        }
    }
};