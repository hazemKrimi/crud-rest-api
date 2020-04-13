const router = require('express').Router;
const Post = require('../models/Post');
const User = require('../models/User');

class PostError extends Error {
    constructor(status, msg, ...params) {
        super(params);
        this.status = status;
        this.msg = msg;
    }
}

class UserError extends Error {
    constructor(status, msg, ...params) {
        super(params);
        this.status = status;
        this.msg = msg;
    }
}

const postsRouter = router();

postsRouter.get('/', async(req, res) => {
    try {
        const posts = await Post.find();
        if (!posts) throw new PostError(500, 'Error getting posts');
        if (posts.length === 0) throw new PostError(400, 'No posts found');
        return res.status(200).json(posts.map(post => ({ ...post._doc })));
    } catch(err) {
        return res.status(err.status).json({ message: err.msg });
    }
});

postsRouter.get('/:id', async(req, res) => {
    try {
        if (!req.params) throw new PostError(400, 'Missing post data');
        if (!req.params.id) throw new PostError(400, 'Missing post data');
        const post = await Post.findById(req.params.id);
        if (!post) throw new PostError(404, 'No post found');
        return res.status(200).json({ ...post._doc });
    } catch(err) {
        return res.status(err.status).send({ message: err.msg });
    }
});

postsRouter.post('/', async(req, res) => {
    try {
        if (!req.authenticated) throw new UserError(403, 'No logged in user');
        if (!req.body) throw new PostError(400, 'Missing post data');
        if (!req.body.title || !req.body.content) throw new PostError(400, 'Missing post data');
        const post = new Post({ title: req.body.title, content: req.body.content, author: req.user.username });
        const user = await User.findOne({ username: req.user.username });
        if (!user) throw new PostError(500, 'Error creating post');
        user.posts++;
        await user.save();
        await post.save();
        return res.status(200).json({ ...post._doc });
    } catch(err) {
        if (err instanceof PostError || err instanceof UserError) return res.status(err.status).send({ message: err.msg });
        else return res.status(500).send({ message: 'Error creating post' });
    }
});

postsRouter.put('/', async(req, res) => {
    try {
        if (!req.authenticated) throw new UserError(403, 'No logged in user');
        if (!req.body) throw new PostError(400, 'Missing post data');
        if (!req.body.id) throw new PostError(400, 'Missing post data');
        if (!req.body.title && !req.body.content) throw new PostError(400, 'Missing post data');
        const post = await Post.findById(req.body.id);
        if (!post) throw new PostError(404, 'No post found');
        if (post.author !== req.user.username) throw new PostError(400, 'This user can\'t update this post');
        if (req.body.title) post.title = req.body.title;
        if (req.body.content) post.content = req.body.content;
        await post.save();
        return res.status(200).json({ ...post._doc });
    } catch(err) {
        if (err instanceof PostError || err instanceof UserError) return res.status(err.status).send({ message: err.msg });
        else return res.status(500).send({ message: 'Error updating post' });
    }
});

postsRouter.delete('/:id', async(req, res) => {
    try {
        if (!req.authenticated) throw new UserError(403, 'No logged in user');
        if (!req.params) throw new PostError(400, 'Missing post data');
        if (!req.params.id) throw new PostError(400, 'Missing post data');
        const post = await Post.findById(req.params.id);
        if (!post) throw new PostError(404, 'No post found');
        if (post.author !== req.user.username) throw new PostError(400, 'This user can\'t delete this post');
        else {
            const user = await User.findOne({ username: req.user.username });
            if (!user) throw new PostError(500, 'Error deleting post');
            user.posts--;
            await user.save();
            const post = await Post.findByIdAndRemove(req.params.id);
            if (!post) throw new PostError(500, 'Error deleting post');
            return res.status(200).json({ ...post._doc });
        }
    } catch(err) {
        if (err instanceof PostError || err instanceof UserError) return res.status(err.status).send({ message: err.msg });
        else return res.status(500).send({ message: 'Error deleting post' });
    }
});

module.exports = postsRouter;