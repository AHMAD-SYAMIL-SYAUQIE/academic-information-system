// Test simple express server
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(5000, () => {
  console.log('Test server running on port 5000');
});
