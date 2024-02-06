const { Readable } = require("stream");
const mime = require("mime-types");
const { v4: uuid } = require("uuid");
const LocalFileAccess = require("../../app/storage/localFileStorage");
const fs = require("fs");
const path = require("path");

const testFilePath = path.join(__dirname, "../../package.json");
const testFile = fs.readFileSync(testFilePath);

describe("LocalFileAccess", () => {
  const fileAccess = new LocalFileAccess();

  describe("uploadFile", () => {
    it("should upload a file and return public/private keys", async () => {
      const field = uuid();

      const result = await fileAccess.uploadFile(field, testFile);

      expect(result).toHaveProperty("publicKey");
      expect(result).toHaveProperty("privateKey");
    });
  });

  describe("getFileByPublicKey", () => {
    it("should return file stream and MIME type if file exists", async () => {
      const field = uuid();
      const { publicKey } = await fileAccess.uploadFile(field, testFile);

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
      const field = uuid();
      const { privateKey } = await fileAccess.uploadFile(field, testFile);

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

  describe("getFileData", () => {
    it("should return file data if file exists for public key", async () => {
      const field = uuid();
      const { publicKey } = await fileAccess.uploadFile(field, testFile);

      const result = fileAccess.getFileData(publicKey, "Public");

      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("isPublic");
    });

    it("should return file data if file exists for private key", async () => {
      const field = uuid();
      const { privateKey } = await fileAccess.uploadFile(field, testFile);

      const result = fileAccess.getFileData(privateKey, "Private");

      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("isPrivate");
    });

    it("should return null if file does not exist", async () => {
      const nonExistingPublicKey = "abc-ere-123-ere-456-ere-abc"; //random_private_key

      const result = fileAccess.getFileData(nonExistingPublicKey);

      expect(result).toBeNull();
    });
  });
});

describe("Cleanup", () => {
  // upload a file and set the file stats date to 8days ago and call the cleanup method

  it("should remove files older than 7 days", async () => {
    const fileAccess = new LocalFileAccess();
    const field = uuid();
    const { publicKey } = await fileAccess.uploadFile(field, testFile);
    const fileData = fileAccess.getFileData(publicKey);
    const filePath = fileData.filePath;
    const date = new Date();
    date.setDate(date.getDate() - 8);
    fs.utimesSync(filePath, date, date);
    await fileAccess.cleanup();
    // try to download the file
    const result = await fileAccess.getFileByPublicKey(publicKey);
    // console.log(result);
    expect(result).toBeNull();
  });
});
