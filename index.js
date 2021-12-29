const express = require('express');
const morgan = require("morgan");
const { createProxyMiddleware } = require('http-proxy-middleware');

// Create Express Server
const app = express();

// Configuration
const PORT = 8080;
const HOST = "localhost";
const API_SERVICE_URL = "https://fantasy.premierleague.com/api";

app.use(morgan('dev'));

// Info GET endpoint
app.get('/test', (req, res, next) => {
   res.send('Test response on endpoint /test');
});

app.use((req, res, next) => {
	res.append('Access-Control-Allow-Origin', ['*']);
	res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.append('Access-Control-Allow-Headers', 'Content-Type');
	next();
});


// Proxy endpoints
app.use('/fpl', createProxyMiddleware({
  target: API_SERVICE_URL,
	changeOrigin: true,
   pathRewrite: {
       [`^/fpl`]: '',
	},
}));

// Start the Proxy
app.listen(PORT, HOST, () => {
	console.log(`Starting Proxy at ${HOST}:${PORT}`);
});