const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const FileAccess = require("./fileAccess");
const { v4: nanoid } = require("uuid");
const multer = require("multer");
const { uploadLimiter, downloadLimiter } = require("./middlewares");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

const fileAccess = new FileAccess();

// Endpoint for file upload
app.post("/files", uploadLimiter, upload.single("file"), async (req, res) => {
  const fileId = nanoid();
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;
  const { publicKey, privateKey, filePath } = await fileAccess.uploadFile(
    fileId + fileName,
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
