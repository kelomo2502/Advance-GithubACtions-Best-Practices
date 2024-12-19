const express = require('express');
const app = express();
const port = 3000;

// Simple endpoint to return a welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Server!');
});

// Another endpoint for testing
app.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app