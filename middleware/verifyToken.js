const jwt = require('jsonwebtoken');

module.exports = async(req, res, next) => {
    try {
        if (!req.headers) throw new Error();
        else if (!req.headers['authorization']) throw new Error();
        else {
            const tokenUser = jwt.verify(req.headers['authorization'].split(' ')[1], process.env.AUTH_TOKEN_SECRET);
            if (!tokenUser) throw new Error();
            else {
                req.authenticated = true;
                req.user = tokenUser;
                next();
            }
        }
    } catch(err) {
        req.authenticated = false;
        next();
    }
};