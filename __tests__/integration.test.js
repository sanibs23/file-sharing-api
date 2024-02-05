const request = require("supertest");
const assert = require("assert"); // Add this if not already in your code
const app = require("../app"); // Adjust the path to your app file
const testImage = `./package.json`;
describe("Integration Tests", function () {
  let publicKey;
  let privateKey;

  // before(async function () {
  //   this.timeout(50000); // Increase timeout to 5000 milliseconds

  //   // Start your server asynchronously
  //   server = await app.listen(9000);
  //   console.log("Server started for testing");
  // });

  // after(async function () {
  //   // Close your server
  //   await server.close();
  //   console.log("Server closed");
  // });

  it("uploads a file and returns public/private keys", (done) => {
    request(app)
      .post("/files")
      .attach("file", testImage)
      .end((err, response) => {
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
});
