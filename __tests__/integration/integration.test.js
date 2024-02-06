const request = require("supertest");
const assert = require("assert");
const app = require("../../app");
const fs = require("fs");
const path = require("path");
const testFile = path.join(__dirname, "../../package.json");
const directoryPath = path.join(__dirname, "../../uploads");
afterAll(() => {
  // Check if the directory exists
  if (fs.existsSync(directoryPath)) {
    // Get all the files and subdirectories within the directory
    const files = fs.readdirSync(directoryPath);

    // Delete all the files within the directory
    files.forEach((file) => {
      // console.log(file);
      const filePath = `${directoryPath}/${file}`;
      // console.log(filePath);
      fs.unlinkSync(filePath);
    });

    // Delete the directory itself
    fs.rmdirSync(directoryPath);
  }
});

describe("Integration Tests", function () {
  let publicKey;
  let privateKey;

  it("should return status 200 and 'Server is running' message on /status endpoint", async () => {
    const response = await request(app).get("/status");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Server is running");
  });

  it("uploads a file and returns public/private keys", (done) => {
    request(app)
      .post("/files")
      .attach("file", testFile)
      .end((_, response) => {
        publicKey = response.body.publicKey;
        privateKey = response.body.privateKey;
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.publicKey);
        assert.ok(response.body.privateKey);
        done();
      });
  });

  test("downloads a file using public key", async () => {
    const response = await request(app).get(`/files/${publicKey}`);

    assert.strictEqual(response.status, 200);
  });

  test("returns 404 for non-existing public key", async () => {
    const nonExistingPublicKey = "abc-ere-123-ere-456-ere-abc"; //random_public_key

    const response = await request(app).get(`/files/${nonExistingPublicKey}`);

    assert.strictEqual(response.status, 404);
  });

  test("removes a file using private key", async () => {
    const response = await request(app).delete(`/files/${privateKey}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.message, "File removed successfully");
  });

  test("returns 404 for non-existing private key", async () => {
    const nonExistingPrivateKey = "abc-ere-123-ere-456-ere-abc"; //random_private_key

    const response = await request(app).delete(
      `/files/${nonExistingPrivateKey}`
    );

    assert.strictEqual(response.status, 404);
  });

  describe("Rate limit", () => {
    let publicKey;
    it("should return 429 status after exceeding rate limit while uploading", async () => {
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post("/files")
          .attach("file", testFile)
          .expect(200);
        publicKey = response.body.publicKey;
      }

      // The next request should be rate-limited
      const res = await request(app)
        .post("/files")
        .attach("file", testFile)
        .catch((err) => ({ ...err, statusCode: 429 }));

      assert.strictEqual(res.statusCode, 429);
    });

    it("should return 429 status after exceeding rate limit while downloading", async () => {
      for (let i = 0; i < 4; i++) {
        await request(app).get(`/files/${publicKey}`).expect(200);
      }

      // The next request should be rate-limited
      const res = await request(app)
        .get(`/files/${publicKey}`)
        .catch((err) => ({ ...err, statusCode: 429 }));

      assert.strictEqual(res.statusCode, 429);
    });
  });
});
