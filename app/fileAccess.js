const LocalFileAccess = require("./localFileStorage"); // Your existing local file access component
const GoogleCloudStorage = require("./googleCloudStorage");
const schedule = require("node-schedule");

/**
 * Represents a file access class that handles file operations based on the provider.
 */
class FileAccess {
  constructor(provider) {
    this.provider = provider;

    if (this.provider === "google") {
      this.fileAccess = new GoogleCloudStorage();
    } else {
      this.fileAccess = new LocalFileAccess();
    }
  }

  /**
   * Initializes the file access class.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  async initialize() {
    if (this.provider === "google") {
      await this.fileAccess.initialize();
    }
  }

  /**
   * Uploads a file.
   * @param {string} field - The field name of the file.
   * @param {File} file - The file to be uploaded.
   * @returns {Promise<any>} A promise that resolves with the result of the file upload.
   */
  async uploadFile(field, file) {
    return this.fileAccess.uploadFile(field, file);
  }

  /**
   * Retrieves a file by its public key.
   * @param {string} publicKey - The public key of the file.
   * @returns {Promise<any>} A promise that resolves with the retrieved file.
   */
  async getFileByPublicKey(publicKey) {
    return this.fileAccess.getFileByPublicKey(publicKey);
  }

  /**
   * Removes a file by its private key.
   * @param {string} privateKey - The private key of the file.
   * @returns {Promise<any>} A promise that resolves with the result of the file removal.
   */
  async removeFileByPrivateKey(privateKey) {
    return this.fileAccess.removeFileByPrivateKey(privateKey);
  }
}

module.exports = FileAccess;
