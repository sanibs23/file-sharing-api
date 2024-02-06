const { Storage } = require("@google-cloud/storage");
const fs = require("fs").promises;
const { v4: uuid } = require("uuid");

/**
 * Represents a class for interacting with Google Cloud Storage.
 * @class
 */
class GoogleCloudStorage {
  constructor() {
    this.configPath = process.env.CONFIG;
    this.config = {};
    this.keyFileMap = new Map();
    this.storage = null; // Will be initialized on demand
  }

  /**
   * Initializes the Google Cloud Storage.
   * @throws {Error} If failed to initialize Google Cloud Storage.
   */
  async initialize() {
    try {
      const config = JSON.parse(await fs.readFile(this.configPath, "utf-8"));
      this.config = config;
      this.storage = new Storage(config);
      await this.ensureBucket();
      await this.setupLifecycleRule();
    } catch (error) {
      console.error("Error initializing Google Cloud Storage:", error);
      throw new Error("Failed to initialize Google Cloud Storage");
    }
  }

  /**
   * Ensures the existence of a Google Cloud Storage bucket.
   * If the bucket doesn't exist, it creates a new one using the specified bucket name from the configuration.
   * @throws {Error} If there is an error ensuring the bucket's existence.
   * @returns {Promise<void>} A promise that resolves when the bucket is ensured.
   */
  async ensureBucket() {
    try {
      const bucket = await this.storage.bucket(this.config?.bucketName);
      if (!bucket) {
        await this.storage.createBucket(this.config?.bucketName);
      }
    } catch (error) {
      console.error("Error ensuring Google Cloud Storage bucket:", error);
      throw new Error("Failed to ensure Google Cloud Storage bucket");
    }
  }

  /**
   * Sets up a lifecycle rule for the Google Cloud Storage bucket.
   * The rule specifies that objects older than a certain age should be deleted.
   * The age is determined by the `lifeCycleAge` property in the configuration,
   * or defaults to 7 days if not provided.
   *
   * @throws {Error} If there is an error setting up the lifecycle rule.
   *
   * @returns {Promise<void>} A promise that resolves when the lifecycle rule is set up successfully.
   */
  async setupLifecycleRule() {
    try {
      await storage.bucket(bucketName).addLifecycleRule({
        action: {
          type: "Delete",
        },
        condition: { age: this.config?.lifeCycleAge || 7 },
      });
    } catch (error) {
      console.error("Error setting up lifecycle rule:", error);
      throw new Error("Failed to set up lifecycle rule");
    }
  }

  /**
   * Generates a key pair consisting of a public key and a private key.
   * @returns {Object} The generated key pair.
   * @property {string} publicKey - The generated public key.
   * @property {string} privateKey - The generated private key.
   */
  generateKeyPair() {
    const publicKey = uuid();
    const privateKey = uuid();
    return { publicKey, privateKey };
  }

  /**
   * Uploads a file to Google Cloud Storage.
   * @param {Object} file - The file to be uploaded.
   * @returns {Object} - An object containing the generated public and private keys.
   * @throws {Error} - If there is an error uploading the file.
   */
  async uploadFile(file) {
    try {
      const { publicKey, privateKey } = this.generateKeyPair();
      const destination = `${publicKey}-${file.originalname}`;
      await this.storage.bucket(this.config.bucketName).upload(file.buffer, {
        destination,
      });

      // Store the mapping between public and private keys
      this.keyFileMap.set(publicKey, { isPublic: true, filePath: destination });
      this.keyFileMap.set(privateKey, {
        isPrivate: true,
        filePath: destination,
      });
      return { publicKey, privateKey };
    } catch (error) {
      console.error("Error uploading file to Google Cloud Storage:", error);
      throw new Error("Failed to upload file to Google Cloud Storage");
    }
  }

  /**
   * Downloads a file from Google Cloud Storage.
   * @param {string} publicKey - The public key of the file.
   * @returns {Promise<Buffer|null>} - A promise that resolves to the downloaded file as a Buffer, or null if the file is not found.
   * @throws {Error} - If there is an error downloading the file.
   */
  async downloadFile(publicKey) {
    try {
      const { filePath } = this.getFileData(publicKey, "Public") || {};
      if (!filePath) {
        throw new Error("File not found for the provided public key");
      }

      const file = await this.storage
        .bucket(this.config.bucketName)
        .file(filePath)
        .download();
      if (file) {
        return file;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error downloading file from Google Cloud Storage:", error);
      throw new Error("Failed to download file from Google Cloud Storage");
    }
  }

  /**
   * Removes a file from Google Cloud Storage.
   * @param {string} privateKey - The private key of the file.
   * @returns {Promise<{ success: boolean }>} - A promise that resolves to an object indicating the success of the operation.
   * @throws {Error} - If there is an error removing the file from Google Cloud Storage.
   */
  async removeFile(privateKey) {
    try {
      const { filePath } = getFileData(privateKey, "Private") || {};

      if (filePath) {
        await this.storage
          .bucket(this.config.bucketName)
          .file(fileData)
          .delete();
        delete this.keyFileMap[publicKey];

        return { success: true };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error("Error removing file from Google Cloud Storage:", error);
      throw new Error("Failed to remove file from Google Cloud Storage");
    }
  }
  /**
   * Retrieves the file data based on the provided key and type.
   * @param {string} key - The key used to identify the file.
   * @param {string} [type="Public"] - The type of file access (default is "Public").
   * @returns {object|null} - The file data if found, otherwise null.
   */
  getFileData(key, type = "Public") {
    const fileData = this.keyFileMap.get(key);

    if (fileData && fileData[`is${type}`]) {
      return fileData;
    } else {
      return null;
    }
  }
}
module.exports = GoogleCloudStorage;
