import { io } from 'socket.io-client';
// import store, {
// 	addChunk,
// 	addFile,
// 	addFileInRedux,
// 	getFile,
// 	getFileChunk,
// 	getFileNames,
// 	getFilesMetaData,
// 	getTotalChunks,
// } from '../redux/store';
import configs from '../configs';
import {
	connections,
	generateAnswer,
	iceCandidates,
	setAnswer,
	setICE,
} from './webrtc';

export const socket = io(configs.SERVER_URL);

socket.on('connect', () => {
	console.log('WebSocket connection established', socket.id);
});

// socket.on('SEND_FILE_NAMES', (data) => {
// 	const receiverId = data.receiverId;
// 	if (receiverId) {
// 		socket.emit('SEND_FILE_NAMES', {
// 			fileNames: getFileNames(store.getState()?.file),
// 			receiverId,
// 		});
// 	}
// });

// socket.on('REQUEST_FILE_META_DATA', (data) => {
// 	const { receiverId } = data;
// 	const senderId = socket.id;
// 	if (receiverId) {
// 		const fileMetaData = getFilesMetaData(store.getState()?.file);
// 		socket.emit('SEND_FILE_META_DATA', {
// 			receiverId,
// 			senderId,
// 			fileMetaData,
// 		});
// 	}
// });

// socket.on('REQUEST_FILE', (data) => {
// 	const receiverId = data.receiverId;
// 	const chunkId = data.chunkId;
// 	const fileId = 0;
// 	if (receiverId && chunkId !== undefined) {
// 		const chunk = getFileChunk(store.getState()?.file, fileId, chunkId);
// 		socket.emit('SEND_FILE', {
// 			fileId,
// 			chunk,
// 			chunkId,
// 			receiverId,
// 			totalChunks: getTotalChunks(store.getState()?.file, fileId),
// 		});
// 	}
// });

// socket.on('RECEIVER_FILE_META_DATA', (data) => {
// 	const fileMetaData = data?.fileMetaData;
// 	if (fileMetaData && fileMetaData.length > 0) {
// 		const { id, filename, size, totalChunks } = fileMetaData[0];
// 		store.dispatch(
// 			addFileInRedux({
// 				id,
// 				filename,
// 				size,
// 				totalChunks,
// 				chunks: [],
// 			})
// 		);
// 	}
// });

// socket.on('RECEIVE_FILE', (data) => {
// 	const { fileId, chunk } = data;
// 	if (fileId !== undefined && chunk !== undefined) {
// 		store.dispatch(addChunk({ fileId, chunk }));
// 	}
// });

socket.on('RECEIVE_OFFER', async (data) => {
	const { offer, sender } = data;
	const answer = await generateAnswer(offer);
	sendAnswer(answer, sender);
	sendICE(iceCandidates, sender);
});

socket.on('RECEIVE_ANSWER', async (data) => {
	const { answer, sender } = data;
	await setAnswer(answer);
	connections.push(sender);
	sendICE(iceCandidates, sender);
});

socket.on('RECEIVE_ICE', async (data) => {
	const { members } = data;
	if (members) {
		await setICE(members);
	}
});

// export const requestFileNames = (senderId) => {
// 	socket.emit('REQUEST_FILE_META_DATA', {
// 		senderId,
// 	});
// };

// export const requestFile = (senderId, fileId) => {
// 	socket.emit('REQUEST_FILE', {
// 		senderId,
// 		fileId,
// 	});
// };

export const sendOffer = (offer, receiver) => {
	socket.emit('SEND_OFFER', {
		offer,
		receiver,
	});
};

export const sendAnswer = (answer, receiver) => {
	socket.emit('SEND_ANSWER', {
		answer,
		receiver,
	});
	connections.push(receiver);
};

export const sendICE = (members, receiver) => {
	socket.emit('SEND_ICE', {
		members,
		receiver,
	});
};
