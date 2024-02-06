# File Sharing API

This project is a file-sharing API platform where users can upload, download, and delete files. It also includes download and upload limits for specific IP addresses.

## Used Technologies

- Nodejs (v20.10.0)
- NPM (v10.2.5)
- Express
- Multer
- uuid
- Jest
- Supertest

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository.
2. Install the dependencies by running `npm install`.
3. Set up the environment variables. You can create a `.env` file in the root directory and define the following variables:
   - `PORT`: The port number on which the server will run (default is 3000).
   - `PROVIDER`: The file storage provider to use (default is "local").
   - `UPLOAD_LIMIT`: The maximum number of file uploads allowed per IP address per day (default is 10).
   - `DOWNLOAD_LIMIT`: The maximum number of file downloads allowed per IP address per day (default is 100).
   - `CONFIG`:Config file path for google-cloud-storage configuration.
4. Start the server by running `npm run start`.

## Endpoints

- `POST /files`: Upload a file. This endpoint requires the following parameters:

  - `file`: The file to upload.
  - Returns the public key, private key of the uploaded file.

- `GET /files/:publicKey`: Download a file using the public key. This endpoint requires the following parameter:

  - `publicKey`: The public key of the file.
  - Returns the file stream.

- `DELETE /files/:privateKey`: Remove a file using the private key. This endpoint requires the following parameter:
  - `privateKey`: The private key of the file.
  - Returns a success message if the file is removed successfully.

## Testing

To run the tests, use the following command:

```bash
npm run test
```

## Description

The unit tests and integrations tests are written using the Jest testing framework using supertest and cover various functionalities of the File Sharing API.

## Test Cases

### The integration tests cover the following scenarios:

- Uploading a file and retrieving public/private keys.
- Downloading a file using a public key.
- Handling non-existing public/private keys.
- Removing a file using a private key.
- Rate limiting while uploading and downloading files.

### The unit tests cover the following test cases:

- `uploadFile`: Tests the upload functionality of the API and verifies that it returns the expected public and private keys.
- `getFileByPublicKey`: Tests the retrieval of a file by its public key and verifies that the returned file stream and MIME type are correct.
- `removeFileByPrivateKey`: Tests the removal of a file by its private key and verifies that the file is successfully removed.
- `getFileData`: Tests the retrieval of file data by either the public or private key and verifies that the returned file data is correct.
- `cleanup`: Tests the cleanup functionality of the API and verifies that files older than 7 days are successfully removed

## Postman collection

- [File-sharing-api-collection](https://api.postman.com/collections/7635645-be17de0a-6a25-4e8a-a587-e09056380c1a?access_key=PMAT-01HNZSMDGHPERWHARWYDKQ4SR8)

## NB

- The testing of Google Cloud Storage functionalities was not included in the test cases as I do not have a Google Cloud account. Therefore, those functionalities were not tested. Thank you.
