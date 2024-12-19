const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Server!');
});

app.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

if (require.main === module) {
  // Start the server only if this is the main module
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

module.exports = app;  // Export the app for testing
