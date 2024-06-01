function createChunks(file, chunkSize) {
	const chunks = [];
	const totalChunks = Math.ceil(file.size / chunkSize);
	for (let i = 0; i < totalChunks; i++) {
		const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
		chunks.push({ id: i, chunk });
	}

	return { chunks, totalChunks };
}

function reconstructFileAndDownload(chunks, fileName) {
	// Ensure chunks are in order based on the id
	chunks.sort((a, b) => a.id - b.id);

	const fileParts = chunks.map((chunkObj) => chunkObj.chunk);

	// Use the Blob constructor to create a single file
	const file = new Blob(fileParts);

	// Create a URL for the Blob
	const url = URL.createObjectURL(file);
	// Create a link element
	const link = document.createElement('a');

	// // Set the href attribute of the link to the Blob URL
	link.href = url;

	// // Set the download attribute with the desired file name
	link.download = fileName;

	// // Append the link to the document body (this will not make it visible)
	document.body.appendChild(link);

	// // Programmatically click the link to trigger the download
	link.click();

	// // Remove the link from the document
	document.body.removeChild(link);

	// // Revoke the Blob URL to free up memory
	URL.revokeObjectURL(url);
}

// Function to split a file into chunks and add metadata
function splitFileIntoChunks(file, fileId, chunkSize) {
	const chunks = [];
	let chunkId = 0;

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const arrayBuffer = reader.result;
			const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

			for (let i = 0; i < totalChunks; i++) {
				const start = i * chunkSize;
				const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
				const chunk = arrayBuffer.slice(start, end);
				const chunkWithMetadata = addMetadataToChunk(
					chunk,
					fileId,
					chunkId++,
					totalChunks
				);
				chunks.push(chunkWithMetadata);
			}

			return resolve({ chunks, totalChunks });
		};

		reader.onerror = (error) => {
			return reject(error);
		};

		reader.readAsArrayBuffer(file);
	});
}

// Function to add metadata to a chunk
function addMetadataToChunk(chunk, fileId, chunkId, totalChunks) {
	const fileIdArray = new Uint8Array(new Uint32Array([fileId]).buffer);
	const chunkIdArray = new Uint8Array(new Uint32Array([chunkId]).buffer);
	const totalChunksArray = new Uint8Array(
		new Uint32Array([totalChunks]).buffer
	);
	const chunkArray = new Uint8Array(chunk);
	const metadata = new Uint8Array(
		fileIdArray.byteLength +
			chunkIdArray.byteLength +
			totalChunksArray.byteLength +
			chunkArray.byteLength
	);
	metadata.set(fileIdArray, 0);
	metadata.set(chunkIdArray, fileIdArray.byteLength);
	metadata.set(
		totalChunksArray,
		fileIdArray.byteLength + chunkIdArray.byteLength
	);
	metadata.set(
		chunkArray,
		fileIdArray.byteLength +
			chunkIdArray.byteLength +
			totalChunksArray.byteLength
	);
	return metadata;
}

// Function to reconstruct the file from chunks and sort them based on chunk id
function reconstructFileFromChunks(chunks) {
	// Sort chunks based on chunk id
	chunks.sort((a, b) => {
		const chunkIdA = new Uint32Array(a.slice(4, 8))[0];
		const chunkIdB = new Uint32Array(b.slice(4, 8))[0];
		return chunkIdA - chunkIdB;
	});

	// Concatenate chunks into a single ArrayBuffer
	const concatenatedChunks = new Uint8Array(
		chunks.reduce((acc, chunk) => acc + chunk.byteLength - 12, 0)
	);
	let offset = 0;
	chunks.forEach((chunk) => {
		const data = new Uint8Array(chunk.slice(12));
		concatenatedChunks.set(data, offset);
		offset += data.byteLength;
	});

	// Generate Blob from ArrayBuffer
	return new Blob([concatenatedChunks]);
}

async function createArrayBufferWithMetadata(blob, fileId, chunkId) {
	// Read the blob as an ArrayBuffer
	const arrayBuffer = await blob.arrayBuffer();

	// Convert fileId and chunkId to Uint8Array
	const fileIdArray = new Uint8Array(new Uint32Array([fileId]).buffer);
	const chunkIdArray = new Uint8Array(new Uint32Array([chunkId]).buffer);

	// Create a new Uint8Array to hold the metadata and the chunk data
	const metadataSize = fileIdArray.byteLength + chunkIdArray.byteLength;
	const totalSize = metadataSize + arrayBuffer.byteLength;
	const resultArray = new Uint8Array(totalSize);

	// Set the metadata in the result array
	resultArray.set(fileIdArray, 0);
	resultArray.set(chunkIdArray, fileIdArray.byteLength);

	// Set the chunk data in the result array
	resultArray.set(new Uint8Array(arrayBuffer), metadataSize);

	// Return the resulting ArrayBuffer
	return resultArray.buffer;
}

function parseArrayBuffer(arrayBuffer) {
	// Create a DataView for reading the fileId and chunkId
	const view = new DataView(arrayBuffer);

	// Read the fileId and chunkId (assuming they are stored as 32-bit integers)
	const fileId = view.getUint32(0, true); // Little-endian
	const chunkId = view.getUint32(4, true); // Little-endian

	// Extract the chunk data
	const chunkArray = new Uint8Array(arrayBuffer, 8); // Skip the first 8 bytes (fileId + chunkId)
	const blobChunk = new Blob([chunkArray]);

	return { fileId, chunkId, blobChunk };
}

export {
	createChunks,
	reconstructFileAndDownload,
	splitFileIntoChunks,
	createArrayBufferWithMetadata,
	parseArrayBuffer,
};
