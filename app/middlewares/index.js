const multer = require("multer");
const rateLimit = require("express-rate-limit");

const storage = multer.memoryStorage();
/**
 * Middleware for handling file uploads.
 * @type {Function}
 */
const uploader = multer({ storage: storage });

const config = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  legacyHeaders: false,
  standardHeaders: true,
  skipFailedRequests: true,
  handler: (_, res, __, options) => {
    return res.status(options.statusCode).send(options.message);
  },
};

// Set up rate limiters for upload and download
const uploadLimiter = rateLimit({
  ...config,
  max: process.env.NODE_ENV === "test" ? 5 : process.env.UPLOAD_LIMIT || 10, // Set the maximum upload limit based on the environment
});

const downloadLimiter = rateLimit({
  ...config,
  max: process.env.NODE_ENV === "test" ? 5 : process.env.UPLOAD_LIMIT || 100,
});

module.exports = { uploader, uploadLimiter, downloadLimiter };
