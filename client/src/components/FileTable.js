import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sendOffer } from '../services/socket';
import {
	createOffer,
	sendMessageOnWebRTC,
	requestFile,
	requestFileMetaData,
} from '../services/webrtc';
import { useDispatch, useSelector } from 'react-redux';
import { isWebRTCConnected, setOwnType } from '../redux/store';

export default function FileTable() {
	const params = useParams();
	const isConnected = useSelector((state) => state.webRTC.isConnected);
	const dispatch = useDispatch();

	const handleDownload = () => {
		requestFile(0);
		// sendMessageOnWebRTC("HELLO")
		// requestFileMetaData();
	};

	useEffect(() => {
		dispatch(setOwnType("RECEIVER"))
		(async () => {
			const senderId = params.socketId;
			const offer = await createOffer();
			sendOffer(offer, senderId);
		})();
	}, []);

	useEffect(() => {
		if (isConnected) {
			requestFileMetaData();
		}
	}, [isConnected]);

	return <button onClick={handleDownload}>Download</button>;
}
