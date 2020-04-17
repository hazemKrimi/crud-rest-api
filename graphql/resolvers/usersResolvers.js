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
            const authToken = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, process.env.AUTH_TOKEN_SECRET, { expiresIn: '15min' });
            const refreshToken = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, process.env.REFRESH_TOKEN_SECRET);
            if (!authToken) throw new Error('Login error');
            if (!refreshToken) throw new Error('Login error');
            user.refreshToken = refreshToken;
            await user.save();
            return {
                authToken,
                refreshToken 
            };
        } catch(err) {
            throw err;
        }
    },
    logout: async(args, req) => {
        if (!req.authenticated) throw new Error('No logged in user');
        const user = await User.findOne({ username: req.user.username });
        if (!user) throw new Error('Error logging out');
        user.refreshToken = '';
        await user.save();
        return 'Logged out successfully';
    },
    token: async(refreshToken) => {
        const tokenUser = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!tokenUser) throw new Error('Invalid token');
        const user = await User.findOne({ refreshToken });
        if (!user) throw new Error('No user found');
        const authToken = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, process.env.AUTH_TOKEN_SECRET, { expiresIn: '15min' });
        return {
            authToken,
            refreshToken
        };
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
                    const refreshToken = jwt.sign({ username, email, posts: 0 }, process.env.REFRESH_TOKEN_SECRET);
                    const authToken = jwt.sign({ username, email, posts: 0 }, process.env.AUTH_TOKEN_SECRET, { expiresIn: '15min' });
                    if (!authToken) throw new Error('Error creating user');
                    if (!refreshToken) throw new Error('Error creating user');
                    const user = new User({ username, email, password: crypto.createHmac('sha256', 'password').update(password).digest('hex'), posts: 0, refreshToken });
                    await user.save();
                    return {
                        authToken,
                        refreshToken
                    };
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
            if (!user) throw new Error('No user found');
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
            const refreshToken = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, process.env.REFRESH_TOKEN_SECRET);
            const authToken = jwt.sign({ username: user.username, email: user.email, posts: user.posts }, process.env.AUTH_TOKEN_SECRET, { expiresIn: '15min' });
            user.refreshToken = refreshToken;
            await user.save();
            if (!authToken) throw new Error('Error updating user');
            if (!refreshToken) throw new Error('Error updating user');
            return {
                authToken,
                refreshToken
            };
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