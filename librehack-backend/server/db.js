const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "1331333999",
    host: "localhost",
    port: 5432,
    database: "librehack"
})

module.exports = pool;