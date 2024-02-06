const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const FileAccess = require("./storage/fileAccess");
const { v4: uuid } = require("uuid");
const { uploader, uploadLimiter, downloadLimiter } = require("./middlewares");

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(morgan("dev"));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
const provider = process.env.PROVIDER || "local"; // Default to local provider

const fileAccess = new FileAccess(provider);

const initialize = async () => {
  try {
    await fileAccess.initialize();
    console.log("FileAccess component initialized successfully.");
  } catch (error) {
    console.error("Error initializing FileAccess component:", error);
    process.exit(1);
  }
};

initialize();
// Endpoint for file upload
app.post("/files", uploadLimiter, uploader.single("file"), async (req, res) => {
  const field = uuid();
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;
  const { publicKey, privateKey, filePath } = await fileAccess.uploadFile(
    field + fileName,
    fileBuffer
  );
  return res.json({ publicKey, privateKey, filePath });
});

// Endpoint for file download using public key
app.get("/files/:publicKey", downloadLimiter, async (req, res) => {
  const { publicKey } = req.params;
  const fileStream = await fileAccess.getFileByPublicKey(publicKey);
  if (fileStream) {
    fileStream.stream.pipe(res);
    res.setHeader("Content-Type", fileStream.mimeType);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Endpoint for file removal using private key
app.delete("/files/:privateKey", async (req, res) => {
  const { privateKey } = req.params;
  const success = await fileAccess.removeFileByPrivateKey(privateKey);
  if (success) {
    res.json({ message: "File removed successfully" });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(port, () => {
  return console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
