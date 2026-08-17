export default async function globalSetup() {
  process.env.MONGO_URI              = 'mongodb://localhost:27017/mindcare-test';
  process.env.JWT_SECRET             = 'test-jwt-secret-mindcare';
  process.env.JWT_REFRESH_SECRET     = 'test-refresh-secret-mindcare';
  process.env.NODE_ENV               = 'test';
  process.env.PORT                   = '5000';
  process.env.JWT_EXPIRES_IN         = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
}
