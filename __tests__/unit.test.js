const { Readable } = require("stream");
const mime = require("mime-types");
const { v4: uuid } = require("uuid");
const FileAccess = require("../app/fileAccess");
const fs = require("fs");
const path = require("path");

const testFilePath = path.join(__dirname, "../package.json");
const testFile = fs.readFileSync(testFilePath);

describe("FileAccess", () => {
  let fileAccess = new FileAccess();

  describe("uploadFile", () => {
    it("should upload a file and return public/private keys", async () => {
      const fileId = uuid();

      const result = await fileAccess.uploadFile(fileId, testFile);

      expect(result).toHaveProperty("publicKey");
      expect(result).toHaveProperty("privateKey");
    });
  });

  describe("getFileByPublicKey", () => {
    it("should return file stream and MIME type if file exists", async () => {
      const fileId = uuid();
      const { publicKey } = await fileAccess.uploadFile(fileId, testFile);

      const result = await fileAccess.getFileByPublicKey(publicKey);

      expect(result).toHaveProperty("stream");
      expect(result).toHaveProperty("mimeType");
      expect(result.stream).toBeInstanceOf(Readable);
      expect(result.mimeType).toBe(
        mime.lookup(fileAccess.getFileData(publicKey).filePath)
      );
    });

    it("should return null if file does not exist", async () => {
      const nonExistingPublicKey = "abc-ere-123-ere-456-ere-abc"; //random_private_key

      const result = await fileAccess.getFileByPublicKey(nonExistingPublicKey);

      expect(result).toBeNull();
    });
  });

  describe("removeFileByPrivateKey", () => {
    it("should remove file and return true if file exists", async () => {
      const fileId = uuid();
      const { privateKey } = await fileAccess.uploadFile(fileId, testFile);

      const result = await fileAccess.removeFileByPrivateKey(privateKey);
      expect(result).toBe(true);
      expect(fileAccess.getFileData(privateKey)).toBeNull();
    });

    it("should return false if file does not exist", async () => {
      const nonExistingPrivateKey = "abc-ere-123-ere-456-ere-abc"; //random_private_key

      const result = await fileAccess.removeFileByPrivateKey(
        nonExistingPrivateKey
      );

      expect(result).toBe(false);
    });
  });
});
