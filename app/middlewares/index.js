const rateLimit = require("express-rate-limit");

// Set up rate limiters for upload and download
const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  max: 1024 * 1024 * 50, // 50 MB upload limit per IP address per day
  message: "Upload limit exceeded for this IP address",
});

const downloadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  max: 1024 * 1024, //* 100, // 100 MB download limit per IP address per day
  message: "Download limit exceeded for this IP address",
});

module.exports = { uploadLimiter, downloadLimiter };
