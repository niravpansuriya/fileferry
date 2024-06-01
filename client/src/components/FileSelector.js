import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { addFileInRedux, setOwnType } from '../redux/store';
import { useDispatch } from 'react-redux';

const FileSelector = () => {
	const dispatch = useDispatch();
	const [selectedFile, setSelectedFile] = useState(null);

	useEffect(() => {
		dispatch(setOwnType({ type: 'SENDER' }));
	}, []);

	const onDrop = useCallback((acceptedFiles) => {
		setSelectedFile(acceptedFiles[0]);
	}, []);

	useEffect(() => {
		(async () => {
			if (selectedFile) {
				dispatch(
					addFileInRedux({
						id: 0,
						filename: selectedFile.name,
						size: selectedFile.size,
						content: selectedFile,
						hasContent: true,
					})
				);
			}
		})();
	}, [selectedFile]);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
	});

	return (
		<div {...getRootProps()} style={styles.dropzone}>
			<input {...getInputProps()} />
			{isDragActive ? (
				<p>Drop the files here...</p>
			) : (
				<p>Drag 'n' drop a file here, or click to select one</p>
			)}
			{selectedFile && (
				<div>
					<p>Selected File: {selectedFile.name}</p>
				</div>
			)}
		</div>
	);
};

const styles = {
	dropzone: {
		border: '2px dashed #cccccc',
		borderRadius: '4px',
		padding: '20px',
		textAlign: 'center',
		cursor: 'pointer',
	},
};

export default FileSelector;
