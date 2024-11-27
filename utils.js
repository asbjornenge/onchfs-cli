import hpack from 'hpack'

export function uint8ArrayToHex(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encodeHeaders(headers) {
  const hp = new hpack();
  const encoded = hp.encode(headers);
  return encoded;
}

export async function writeInscriptions(Tezos, batch, onchfsContract) {
  try {
    let batchBuilder = Tezos.contract.batch();

    for (const inscription of batch) {
      if (inscription.type === 'chunk') {
        // Convert content to hex string
        const dataHex = '0x' + uint8ArrayToHex(inscription.content);
        // Add write_chunk operation to batch
        batchBuilder = batchBuilder.withContractCall(onchfsContract.methods.write_chunk(dataHex));
      } else if (inscription.type === 'file') {
        // Convert chunks and metadata to required format
        const chunkPointers = inscription.chunks.map(chunk => '0x' + uint8ArrayToHex(chunk));
        const metadataHex = '0x' + uint8ArrayToHex(inscription.metadata);
        // Add create_file operation to batch
        batchBuilder = batchBuilder.withContractCall(
          onchfsContract.methodsObject.create_file({
            chunk_pointers: chunkPointers,
            metadata: metadataHex,
          })
        );
      }
    }

    // Send the batch operation
    const batchOperation = await batchBuilder.send();

    console.log(`Awaiting confirmation for batch operation ${batchOperation.hash}...`);
    await batchOperation.confirmation();

    console.log(`Batch operation completed with hash: ${batchOperation.hash}`);
  } catch (error) {
    console.error('Error writing inscriptions:', error);
  }
}
