import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),
  /**
   * That long string from mlab
   */
  databaseURL: process.env.MONGODB_URI,
  /**
   * Your secret sauce
   */
  jwtSecret: process.env.JWT_SECRET,
  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
  /**
   * Mongoose Debug
   */
  mongooseDebug: process.env.MONGOOSE_DEBUG,
  /**
   * Agenda.js stuff
   */
  agenda: {
    dbCollection: process.env.AGENDA_DB_COLLECTION,
    pooltime: process.env.AGENDA_POOL_TIME,
    concurrency: parseInt(process.env.AGENDA_CONCURRENCY, 10),
  },
  /**
   * Tripadvisor config
   */
  tripadvisor: {
    baseUrl: 'https://www.tripadvisor.com.ar',
    countryDefault: 'argentina',
    countries: [
      {
        name: 'argentina',
        urlIndex: '/ShowForum-g294266-i977-Argentina.html',
        urlPage: '/ShowForum-g294266-i977-o%s-Argentina.html',
      },
    ],
  },
  /**
   * Admin config
   */
  admin: {
    user: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD,
  },
  /**
   * API configs
   */
  api: {
    prefix: '/api',
    maxProcessPython: parseInt(process.env.PYTHON_PROCESS_MAXIMUM, 10),
  },
};
