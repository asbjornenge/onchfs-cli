import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import sha3 from 'js-sha3'
import onchfs from 'onchfs'
import {
  TEZOS_RPC,
  TEZOS_PRIVATE_KEY,
  ONCHFS_CONTRACT_ADDRESS
} from './config.js'
import { 
  encodeHeaders,
  uint8ArrayToHex, 
  writeInscriptions 
} from './utils.js'
const { keccak256 } = sha3;

if (!TEZOS_PRIVATE_KEY) {
  console.error('Please set environment variable TEZOS_PRIVATE_KEY.');
  process.exit(1);
}

// Initialize Tezos toolkit
const Tezos = new TezosToolkit(TEZOS_RPC);
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
    // TODO: why :path?
    const headers = { ':path': path.basename(filePath), 'content-type': mime.getType(filePath) };
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
      await writeInscriptions(Tezos, batch, onchfsContract);
    }

    console.log('File upload completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}


main();

