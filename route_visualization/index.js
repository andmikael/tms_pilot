const express = require('express');
const path = require('path');

// Initialize the app
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve Leaflet and Leaflet Routing Machine files
app.use('/leaflet', express.static(path.join(__dirname, 'leaflet', 'dist')));
app.use('/leaflet-routing-machine', express.static(path.join(__dirname, 'leaflet-routing-machine', 'dist')));

// Define a route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
