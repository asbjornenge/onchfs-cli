import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import sha3 from 'js-sha3'
import onchfs from 'onchfs'
import { CONFIG } from './config.js'
import { 
  encodeHeaders,
  uint8ArrayToHex, 
  writeInscriptions 
} from './utils.js'
const { keccak256 } = sha3;

export async function upload({ Tezos, filePath }) {
  const stats = fs.statSync(filePath);
  if (stats.size > CONFIG.network.MAX_FILE_SIZE) {
    console.error(`Error: File size exceeds the limit of ${CONFIG.network.MAX_FILE_SIZE} bytes.`);
    process.exit(1);
  }

  const bytes = fs.readFileSync(filePath)
  const data = new Uint8Array(bytes)
  const node = onchfs.files.prepare({ path: path.basename(filePath), content: data })
  const fileCIDHex = uint8ArrayToHex(node.cid)
  console.log('CID:', fileCIDHex);

  const inscriptions = await onchfs.inscriptions.prepare(node)
  const batches = onchfs.inscriptions.batch(inscriptions, 32000)

  for (const batch of batches) {
    await writeInscriptions(Tezos, batch)
  }

  console.log('File upload completed successfully.');
}   
