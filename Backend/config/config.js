module.exports = {
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/election-map',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000
  };