const { Server } = require('socket.io');

let io;

const initIo = (server) => {
	io = new Server(server, {
		cors: {
			origin: '*',
			// methods: ['GET', 'POST'],
		},
		maxHttpBufferSize: 1e8,
		pingTimeout: 60000,
	});

	return io;
};

const handleSocketConnection = (socket) => {
	// sender is saying to send the file chunk to the receiver
	socket.on('SEND_FILE', (data) => {
		const { receiverId, totalChunks, chunkId, fileId } = data;
		if (isSocketConnected(receiverId)) {
			io.to(receiverId).emit('RECEIVE_FILE', data);

			if (chunkId + 1 < totalChunks) {
				socket.emit('REQUEST_FILE', {
					receiverId,
					fileId,
					chunkId: chunkId + 1,
				});
			}
		}
	});

	// receiver is requesting the file chunk from the sender
	socket.on('REQUEST_FILE', (data) => {
		const { senderId, fileId } = data;
		const receiverId = socket.id;
		if (isSocketConnected(senderId) && isSocketConnected(receiverId)) {
			io.to(senderId).emit('REQUEST_FILE', {
				receiverId,
				fileId,
				chunkId: 0,
			});
		}
	});

	socket.on('REQUEST_FILE_META_DATA', (data) => {
		const senderId = data.senderId;
		const receiverId = socket.id;
		if (isSocketConnected(senderId) && isSocketConnected(receiverId)) {
			io.to(senderId).emit('REQUEST_FILE_META_DATA', {
				receiverId: socket.id,
			});
		}
	});

	socket.on('SEND_FILE_META_DATA', (data) => {
		const { receiverId } = data;
		if (isSocketConnected(receiverId)) {
			io.to(receiverId).emit('RECEIVER_FILE_META_DATA', data);
		}
	});

	socket.on('SEND_OFFER', (data) => {
		const { offer, receiver } = data;
		const sender = socket.id;
		if (offer && isSocketConnected(receiver)) {
			io.to(receiver).emit('RECEIVE_OFFER', {
				offer,
				sender,
			});
		}
	});

	socket.on('SEND_ANSWER', (data) => {
		const { answer, receiver } = data;
		const sender = socket.id;
		if (answer && isSocketConnected(receiver)) {
			io.to(receiver).emit('RECEIVE_ANSWER', {
				answer,
				sender,
			});
		}
	});

	socket.on('SEND_ICE', (data) => {
		const { members, receiver } = data;
		const sender = socket.id;

		if (members && isSocketConnected(receiver)) {
			io.to(receiver).emit('RECEIVE_ICE', {
				members,
				sender,
			});
		}
	});

	socket.on('disconnect', () => {
		console.log('User disconnected');
	});
};

const isSocketConnected = (id) => {
	return io.sockets.sockets.get(id) !== undefined;
};

module.exports = { handleSocketConnection, initIo, isSocketConnected };
