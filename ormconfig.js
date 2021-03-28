const { parse } = require('@augu/dotenv');
const { join } = require('path');

const config = parse({
  populate: false,
  file: join(__dirname, '.env'),

  schema: {
    DATABASE_USERNAME: 'string',
    DATABASE_PASSWORD: 'string',
    DATABASE_NAME: 'string',
    DATABASE_HOST: 'string',
    DATABASE_PORT: 'int',
    NODE_ENV: {
      type: 'string',
      default: ['development', 'production']
    }
  }
});

module.exports = {
  migrations: ['./build/migrations/*.js'],
  username: config.DATABASE_USERNAME,
  password: config.DATABASE_PASSWORD,
  entities: ['./build/entities/*.js'],
  database: config.DATABASE_NAME,
  logging: false, // enable this when the deprecated message is gone
  type: 'postgres',
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,

  cli: {
    migrationsDir: 'src/migrations'
  }
};
