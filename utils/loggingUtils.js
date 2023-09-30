const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

const logger = winston.createLogger({
 format: winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "DD-MM-YYYY HH:mm:ss"
  }),
  winston.format.align(),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
 ),
 transports: [
  new winston.transports.Console(),
  new DailyRotateFile({
    level: "info",
    dirname: "logs",
    filename: "%DATE%.log",
    datePattern: "DD-MM-YYYY",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "3d",
  }),
 ]
});

module.exports = logger;