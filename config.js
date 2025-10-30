export const { 
    PORT = 3000,
    SALT_ROUNDS = 10,
    ACCESS_SECRET = 'this-is-an-awesome-secret-key-that-should-be-secret',
    REFRES_SECRET = 'this-is-an-refresh-token-even-more-secret-that-the-access-secret'
} = process.env;