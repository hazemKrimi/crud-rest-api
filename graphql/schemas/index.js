const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type User {
        _id: ID!
        username: String!
        email: String!
        password: String!
        posts: Int!
    }

    type Post {
        _id: ID!
        title: String!
        content: String!
        author: String!
    }

    type Token {
        token: String!
    }

    type RootQuery {
        posts: [Post!]!
        post(id: String!): Post
        users: [User!]!
        user(username: String!): User
        login(email: String!, password: String!): Token
        deleteUser: User
        deletePost(id: String!): Post
    }

    type RootMutation {
        createPost(title: String!, content: String!): Post
        updatePost(id: String! title: String, content: String): Post
        createUser(username: String!, email: String!, password: String!): Token
        updateUser(username: String, email: String, password: String): Token
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);