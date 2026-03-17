const { validationResult } = require('express-validator');

/** Runs express-validator checks and short-circuits with 422 on failure */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

/** Global error handler — mount last in app */
function errorHandler(err, req, res, _next) {
  console.error(err);
  const status  = err.status  || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

/** Wrap async route handlers so thrown errors bubble to errorHandler */
function asyncWrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { validate, errorHandler, asyncWrap };
