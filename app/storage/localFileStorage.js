const fs = require("fs");
const { v4: uuid } = require("uuid");
const mime = require("mime-types");
const path = require("path");
const stream = require("stream");
const schedule = require("node-schedule");

/**
 * Class representing a file access utility.
 * @class
 */
class LocalFileAccess {
  constructor(rootFolder = process.env.FOLDER) {
    this.rootFolder = rootFolder;
    this.keyFileMap = new Map(); // Map to store the association between keys and file content
    this.cleanupSchedule();
  }

  /**
   * Ensures that the root folder exists. If the root folder does not exist, it will be created.
   * @returns {Promise<void>} A promise that resolves when the root folder is ensured.
   * @throws {Error} If there is an error creating the root folder.
   */
  async ensureRootFolder() {
    try {
      await fs.promises.access(this.rootFolder);
    } catch (error) {
      await fs.promises.mkdir(this.rootFolder, { recursive: true }, (err) => {
        throw new Error(`Error creating root folder: ${err}`);
      });
    }
  }

  generateKeyPair() {
    const publicKey = uuid();
    const privateKey = uuid();
    return { publicKey, privateKey };
  }

  /**
   * Uploads a file with the given field and content.
   * @param {string} field - The unique identifier for the file.
   * @param {string} content - The content of the file to be uploaded.
   * @returns {Object} - An object containing the public and private keys associated with the uploaded file.
   * @throws {Error} - If there is an error uploading the file.
   */
  async uploadFile(field, content) {
    await this.ensureRootFolder();

    const { publicKey, privateKey } = this.generateKeyPair();

    const filePath = path.join(this.rootFolder, field);

    fs.writeFileSync(filePath, content);

    // Store the association between keys and file content
    this.keyFileMap.set(publicKey, { isPublic: true, filePath });
    this.keyFileMap.set(privateKey, { isPrivate: true, filePath });

    return { publicKey, privateKey };
  }

  /**
   * Retrieves a file by its public key.
   * @param {string} publicKey - The public key of the file.
   * @returns {Promise<{stream: ReadableStream, mimeType: string}> | null} - A promise that resolves to an object containing the file stream and MIME type, or null if the file does not exist.
   */
  async getFileByPublicKey(publicKey) {
    try {
      const fileData = this.getFileData(publicKey);
      if (fileData) {
        const readStream = fs.createReadStream(fileData.filePath);

        // Get the MIME type of the file
        const mimeType = mime.lookup(fileData.filePath);
        const readableStream = new stream.Readable().wrap(readStream);

        return { stream: readableStream, mimeType };
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * Removes a file by its private key.
   * @param {string} privateKey - The private key of the file.
   * @returns {boolean} - Returns true if the file is successfully removed, false otherwise.
   */
  async removeFileByPrivateKey(privateKey) {
    try {
      const fileData = this.getFileData(privateKey, "Private");
      if (fileData) {
        await fs.promises.unlink(fileData.filePath);
        this.keyFileMap.delete(privateKey);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
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
  /**
   * Cleans up the storage in midnight.
   */
  cleanupSchedule() {
    schedule.scheduleJob("0 0 * * *", () => {
      this.cleanup();
    });
  }
  /**
   * Cleans up the uploads folder by removing files that have been inactive for a certain period of time.
   */
  cleanup() {
    const now = Date.now();
    const inactivityPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    try {
      for (const [key, value] of this.keyFileMap) {
        console.log(
          now - fs.statSync(value.filePath).atimeMs > inactivityPeriod
        );
        if (now - fs.statSync(value.filePath).atimeMs > inactivityPeriod) {
          this.keyFileMap.delete(key);
          fs.unlinkSync(value.filePath);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = LocalFileAccess;
