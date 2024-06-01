require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { handleSocketConnection, initIo } = require('./socket');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'build')));
const server = http.createServer(app);
const io = initIo(server);

app.use('*', (req, res) => {
	return res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});
io.on('connection', (socket) => {
	handleSocketConnection(socket);
});

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
