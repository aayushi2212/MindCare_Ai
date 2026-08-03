/**
 * PURPOSE
 * -------
 * Establishes and exports the Mongoose connection to MongoDB.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Connect to MongoDB using MONGO_URI from environment config
 * - Log connection events (connected, error, disconnected)
 * - Export a single connectDB() async function
 *
 * NEVER
 * -----
 * - Run queries directly
 * - Define schemas or models
 * - Call process.exit() — let server.js handle fatal errors
 *
 * EXPORTS
 * -------
 * connectDB() — async function that resolves when connected
 *
 * DEPENDS ON
 * ----------
 * mongoose, config/environment, shared/logger
 */

import mongoose from 'mongoose';
import env from '../environment/index.js';
import logger from '../../shared/logger/logger.js';

const MONGOOSE_OPTIONS = {
  // Use IPv4 first to avoid DNS resolution issues with MongoDB Atlas
  family: 4,
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, MONGOOSE_OPTIONS);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export default connectDB;
