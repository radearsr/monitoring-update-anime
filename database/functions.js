const mysql = require("mysql");

exports.publicConf = mysql.createPool({
  host:"deyapro.com",
  user: "deyaproc_denonime",
  password: "d3n0n1m3Db",
  database: "deyaproc_scraping",
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
