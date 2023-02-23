const {MDBErrorLoggingModel} = require("../../models/logging/errorLogging");
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Express error handler has four parameters.
 */
function errorHandler(err, req, res, next) {
  console.error(err);
  const {name, message, statusCode, stack, ...others} = err;
  const errorLogging = new MDBErrorLoggingModel({
    message: message,
    name: name,
    stack: stack,
    statusCode: statusCode || 500,
    date: new Date(),
    req: {url: req.originalUrl, method: req.method},
  });
  errorLogging.save();
  res.status(statusCode || 500).json({
    success: false,
    detail: others,
    message: message,
    stack: isProduction ? undefined : stack,
  });
}

module.exports = {errorHandler};
