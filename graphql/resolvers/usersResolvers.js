const User = require('../../models/User');
const Post = require('../../models/Post');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

module.exports = {
    login: async({ email, password }) => {
        try {
            if (!email || !password) throw new Error('Missing user data');
            const user = await User.findOne({ email });
            if (!user) throw new Error('No user found');
            if (user.password !== crypto.createHmac('sha256', 'password').update(password).digest('hex')) throw new Error('Invalid password');
            const token = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, 'key', { expiresIn: '1h' });
            if (!token) throw new Error('Login error');
            return { token };
        } catch(err) {
            throw err;
        }
    },
    users: async() => {
        try {
            const users = await User.find();
            if (!users) throw new Error('Error getting users');
            if (users.length === 0) throw new Error('No users found');
            return users.map(user => ({ ...user._doc }));
        } catch(err) {
            throw err;
        }
    },
    user: async({ username }) => {
        try {
            if (!username) throw new Error('Missing user data');
            const user = await User.findOne({ username });
            if (!user) throw new Error('No user found');
            return { ...user._doc };
        } catch(err) {
            throw err;
        }
    },
    createUser: async({ username, email, password }) => {
        try {
            if (!username || !email || !password) throw new Error('Missing user data');
            const user = await User.findOne({ username });
            if (user) throw new Error('User already exists');
            else {
                const user = await User.findOne({ email });
                if (user) throw new Error('User already exists');
                else {
                    const user = new User({ username, email, password: crypto.createHmac('sha256', 'password').update(password).digest('hex'), posts: 0 });
                    await user.save();
                    const token = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, 'key', { expiresIn: '1h' });
                    if (!token) throw new UserError(500, 'Error creating user');
                    return { token };
                }
            }
        } catch(err) {
            throw err;
        }
    },
    updateUser: async({ username, email, password }, req) => {
        try {
            if (!req.authenticated) throw new Error('No logged in user');
            if (!username && !email && !password) throw new Error('Missing user data');
            const user = await User.findOne({ username: req.user.username });
            if (!user) throw new Error('Error updating user');
            if (username) {
                const u = await User.findOne({ username });
                if (u) throw new Error('Username already exists');
                await Post.updateMany({ author: user.username }, { author: username });
                user.username = username;
            }
            if (email) {
                const u = await User.findOne({ email });
                if (u) throw new Error('Email already exists');
                user.email = email;
            }
            if (password) user.password = crypto.createHmac('sha256', 'password').update(password).digest('hex');
            await user.save();
            const token = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, 'key', { expiresIn: '1h' });
            if (!token) throw new Error(500, 'Error updating user');
            return { token };
        } catch(err) {
            throw err;
        }
    },
    deleteUser: async(args, req) => {
        try {
            if (!req.authenticated) throw new Error('No logged in user');
            const user = await User.findOneAndRemove({ username: req.user.username });
            if (!user) throw new Error('Error deleting user');
            await Post.deleteMany({ author: user.username });
            return { ...user._doc };
        } catch(err) {
            throw err;
        }
    }
};