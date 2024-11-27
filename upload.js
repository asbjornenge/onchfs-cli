import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import sha3 from 'js-sha3'
import onchfs from 'onchfs'
import {
  ONCHFS_CONTRACT_ADDRESS,
  MAX_FILE_SIZE,
  TEZOS_RPC, // Add the Tezos RPC for cost calculation
} from './config.js'
import { 
  encodeHeaders,
  uint8ArrayToHex, 
  writeInscriptions 
} from './utils.js'
const { keccak256 } = sha3;

export async function upload({ Tezos, filePath }) {

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
        console.error(`Error: File size exceeds the limit of ${MAX_FILE_SIZE} bytes.`);
        process.exit(1);
    }

    // Get the OnchFS contract instance
    const onchfsContract = await Tezos.contract.at(ONCHFS_CONTRACT_ADDRESS);


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


    // Process each batch
    for (const batch of batches) {
      await writeInscriptions(Tezos, batch, onchfsContract);
    }

    console.log('File upload completed successfully.');
}   
