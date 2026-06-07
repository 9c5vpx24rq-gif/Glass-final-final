require("dotenv").config();
const { Pool } = require("pg");

const config = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'glass'
};
const pool = new Pool(config);
 module.exports = pool;
