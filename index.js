import {
  TEZOS_RPC,
  TEZOS_PRIVATE_KEY,
  ONCHFS_CONTRACT_ADDRESS
} from './config.js'

import fs from 'fs' 
import path from 'path'
import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import sha3 from 'js-sha3'
import onchfs = from 'onchfs'
import { uint8ArrayToHex } from './utils.js'
import { encodeHeaders } from './hpack.js'
const { keccak256 } = sha3;

if (!TEZOS_PRIVATE_KEY || !ONCHFS_CONTRACT_ADDRESS) {
  console.error('Please set TEZOS_PRIVATE_KEY and ONCHFS_CONTRACT_ADDRESS in your .env file.');
  process.exit(1);
}

// Initialize Tezos toolkit
const Tezos = new TezosToolkit(RPC_URL);
Tezos.setProvider({
  signer: new InMemorySigner(TEZOS_PRIVATE_KEY),
});

async function main() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node uploadFile.js <file_path>');
    process.exit(1);
  }

  try {
    // Read file content
    const bytes = fs.readFileSync(filePath);
    const data = new Uint8Array(bytes);

    // Encode headers using HPACK
    const headers = { ':path': path.basename(filePath), 'content-type': 'text/markdown' };
    const encodedHeaders = encodeHeaders(headers);

    // Prepare the file node using onchfs
    const node = onchfs.files.prepare({ path: path.basename(filePath), content: data, metadata: encodedHeaders });

    // Extract the file CID from the node
    const fileCIDHex = uint8ArrayToHex(node.cid);
    console.log('File CID:', fileCIDHex);

    // Prepare inscriptions
    const inscriptions = await onchfs.inscriptions.prepare(node, {
      getInode: async cid => {
        // Implement getInode function as needed
        return null; // For now, we assume the inode does not exist
      },
    });

    // Batch inscriptions
    const batches = onchfs.inscriptions.batch(inscriptions, 32000);

    // Get the OnchFS contract instance
    const onchfsContract = await Tezos.contract.at(ONCHFS_CONTRACT_ADDRESS);

    // Process each batch
    for (const batch of batches) {
      await writeInscriptions(batch, onchfsContract);
    }

    console.log('File upload completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function writeInscriptions(batch, onchfsContract) {
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

main();

