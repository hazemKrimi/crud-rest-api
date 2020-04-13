const usersResolvers = require('./usersResolvers');
const postsResolvers = require('./postsResolvers');

module.exports = {
    ...usersResolvers,
    ...postsResolvers
};