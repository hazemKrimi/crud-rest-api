const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async(req, res, next) => {
    try {
        if (!req.headers) throw new Error();
        else if (!req.headers['authorization']) throw new Error();
        else {
            const tokenUser = jwt.verify(req.headers['authorization'].split(' ')[1], 'key');
            if (!tokenUser) throw new Error();
            else {
                const user = await User.findOne({ username: tokenUser.username, email: tokenUser.email });
                if (!user) throw new Error();
                else {
                    req.authenticated = true;
                    req.user = tokenUser;
                    next();
                }
            }
        }
    } catch(err) {
        req.authenticated = false;
        next();
    }
};