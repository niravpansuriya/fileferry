import store, {
	addChunkInFile,
	addFileInRedux,
	getFileChunkInArrayBuffer,
	getFilesMetaData,
	getTotalChunks,
	setIsWebRTCConnected,
} from '../redux/store';
import { parseArrayBuffer } from '../utils/files';
import { sendICE } from './socket';

export const peerConnection = new RTCPeerConnection();
export const dataConnection = peerConnection.createDataChannel('fileChannel');
export const arrayBufferConnection =
	peerConnection.createDataChannel('arrayBufferChannel');
export const iceCandidates = [];
export const connections = [];

peerConnection.onicecandidate = (event) => {
	if (event.candidate) {
		iceCandidates.push(event.candidate);
		for (const connection of connections) {
			sendICE([event.candidate], connection);
		}
	}
};

peerConnection.ondatachannel = (event) => {
	if (event.channel.label === 'arrayBufferChannel') {
		event.channel.onopen = () => {
			console.log('Array Buffer Channel is connected');
		};

		event.channel.onmessage = async (event) => {
			const data = parseArrayBuffer(event.data);
			if (data) {
				const { fileId, chunkId, blobChunk } = data;
				if (fileId != undefined && chunkId != undefined && blobChunk) {
					store.dispatch(
						addChunkInFile({
							fileId,
							chunkId,
							chunk: blobChunk,
						})
					);
				}
			}
		};
	} else {
		event.channel.onopen = () => {
			console.log('Listener is connected');
			updateConnectionStatus(true);
		};

		event.channel.onmessage = async (event) => {
			var received = JSON.parse(event.data);
			// received = await deserialize(received);
			await handleMessage(received);
		};
	}
};

export const createOffer = async () => {
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);
	return Promise.resolve(offer);
};

export const generateAnswer = async (offer) => {
	if (offer) {
		await peerConnection.setRemoteDescription(
			new RTCSessionDescription(offer)
		);
		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);
		return Promise.resolve(answer);
	}
};

export const setAnswer = async (answer) => {
	if (answer) {
		await peerConnection.setRemoteDescription(
			new RTCSessionDescription(answer)
		);
		return Promise.resolve();
	}
};

export const setICE = async (members) => {
	if (members) {
		let shouldContinue = [true];
		let i = 0;
		for (const _ of shouldContinue) {
			if (i == members.length) break;
			shouldContinue.push(true);
			await peerConnection.addIceCandidate(
				new RTCIceCandidate(members[i])
			);
			i += 1;
		}

		return Promise.resolve();
	}
};

export const sendMessageOnWebRTC = async (type, data) => {
	data = { type, data };
	// data = await serialize({ type, data });
	dataConnection.send(JSON.stringify(data));
};

export const sendMessageOnArrayBufferChannel = async (bufferData) => {
	return new Promise((resolve, reject) => {
		const sendChunk = () => {
			arrayBufferConnection.send(bufferData);
			return resolve();
		};

		if (arrayBufferConnection.bufferedAmount < 64 * 1024) {
			sendChunk();
		} else {
			const onBufferedAmountLow = () => {
				arrayBufferConnection.removeEventListener(
					'bufferedamountlow',
					onBufferedAmountLow
				);
				sendChunk();
			};

			arrayBufferConnection.addEventListener(
				'bufferedamountlow',
				onBufferedAmountLow
			);
		}
	});
};

export const updateConnectionStatus = (status) => {
	store.dispatch(setIsWebRTCConnected({ status }));
};

const handleMessage = async (message) => {
	const { type, data } = message;
	if (type === 'REQUEST_FILE_META_DATA') {
		const filesMetaData = getFilesMetaData(store.getState()?.file);
		sendMessageOnWebRTC('RECEIVE_FILE_META_DATA', filesMetaData);
	} else if (type === 'RECEIVE_FILE_META_DATA') {
		const filesMetaData = data;
		if (filesMetaData && filesMetaData.length > 0) {
			for (const fileMetaData of filesMetaData) {
				const { id, filename, size, totalChunks } = fileMetaData;
				if (
					id != undefined &&
					filename &&
					size != undefined &&
					totalChunks != undefined
				)
					store.dispatch(
						addFileInRedux({
							id,
							filename,
							size,
							totalChunks,
							chunks: [],
						})
					);
			}
		}
	} else if (type === 'REQUEST_FILE') {
		const { fileId } = data;
		if (fileId != undefined) {
			const totalChunks = getTotalChunks(store.getState()?.file, fileId);
			let totalChunksSent = 0;
			const shouldContinue = [true];
			for (const _ of shouldContinue) {
				shouldContinue.push(true);
				const chunkArrayBuffer = await getFileChunkInArrayBuffer(
					store.getState()?.file,
					fileId,
					totalChunksSent
				);
				await sendMessageOnArrayBufferChannel(chunkArrayBuffer);
				totalChunksSent += 1;
				if (totalChunksSent == totalChunks) break;
			}
		}
	}
};

export const requestFileMetaData = async () => {
	await sendMessageOnWebRTC('REQUEST_FILE_META_DATA', {});
};

export const requestFile = async (fileId, chunkId = 0) => {
	await sendMessageOnWebRTC('REQUEST_FILE', {
		fileId,
		chunkId,
	});
};
