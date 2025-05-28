const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(res.code || 500).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = { notFound, errorHandler };
