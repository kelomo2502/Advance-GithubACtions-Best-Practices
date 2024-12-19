const request = require('supertest');
const app = require('../server');  // Import the server
let server;

beforeAll(() => {
  // Start the server before tests
  server = app.listen(3000);  // You may change port as needed
});

afterAll((done) => {
  // Close the server after tests
  server.close(done);
});

describe('Node.js Server', () => {
  it('should return a welcome message from the root route', async () => {
    const response = await request(app).get('/');
    expect(response.text).toBe('Welcome to the Node.js Server!');
  });

  it('should return a status JSON object from the /status route', async () => {
    const response = await request(app).get('/status');
    expect(response.body.status).toBe('OK');
  });
});
