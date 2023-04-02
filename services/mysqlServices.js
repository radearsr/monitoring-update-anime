require("dotenv").config();
const mysql = require("mysql");

exports.publicConf = mysql.createPool({
  host: process.env.PUBLIC_MYSQL_HOST,
  user: process.env.PUBLIC_MYSQL_USER,
  password: process.env.PUBLIC_MYSQL_PASSWORD,
  database: process.env.PUBLIC_MYSQL_DATABASE,
});

exports.localConf = mysql.createPool({
  host:"localhost",
  user: "root",
  password: "",
  database: "scraping",
});

exports.connectToDatabase = (pool) => (new Promise((resolve, reject) => {
  pool.getConnection((error, conn) => {
    if (error) reject(error);
    resolve(conn);
  });
}));

exports.queryDatabase = (connection, sqlString, escapeStrValue) => (new Promise((resolve, reject) => {
  connection.query(sqlString, escapeStrValue, (error, result) => {
    if (error) reject(error);
    resolve(result);
  });
  connection.release();
}));

exports.logging = (sqlString, escapeStrValue) => {
  return mysql.format(sqlString, escapeStrValue);
}
