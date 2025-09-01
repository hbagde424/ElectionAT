module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://developer:Hh@1q2w3e4r5t6y7u8i9o@cluster0.8ehw8jn.mongodb.net/ElectionAtlas',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 5000,
  BASE_URL: process.env.BASE_URL || 'https://myhostmanager.co.in/backend'
};