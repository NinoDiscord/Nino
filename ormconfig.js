const yaml = require('js-yaml');
const config = yaml.load(require('fs').readFileSync('./config.yml', 'utf-8'));

module.exports = config.url !== undefined ? {
  migrations: ['./build/migrations/*.js'],
  entities: ['./build/entities/*.js'],
  logging: false, // enable this when the deprecated message is gone
  type: 'postgres',
  url: config.database.url,

  cli: {
    migrationsDir: 'src/migrations'
  }
} : {
  migrations: ['./build/migrations/*.js'],
  username: config.database.username,
  password: config.database.password,
  entities: ['./build/entities/*.js'],
  database: config.database.name,
  logging: false, // enable this when the deprecated message is gone
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,

  cli: {
    migrationsDir: 'src/migrations'
  }
};
