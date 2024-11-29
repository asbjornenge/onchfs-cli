import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import sha3 from 'js-sha3'
import onchfs from './onchfs.js'
import { CONFIG } from './config.js'
import { 
  encodeHeaders,
  uint8ArrayToHex, 
  writeInscriptions 
} from './utils.js'
const { keccak256 } = sha3;

function getAllFilesSync(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFilesSync(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

export async function upload({ Tezos, filePath }) {
  const stats = fs.statSync(filePath);

  if (stats.isFile()) {
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
  } else if (stats.isDirectory()) {
    const files = getAllFilesSync(filePath)
    const oversizedFile = files.find(file => fs.statSync(file).size > CONFIG.network.MAX_FILE_SIZE)
    if (oversizedFile) {
      console.error(`Error: File ${oversizedFile} exceeds the limit of ${CONFIG.network.MAX_FILE_SIZE} bytes.`);
      process.exit(1);
    }

    const fileObjects = files.map(file => {
      const bytes = fs.readFileSync(file)
      const data = new Uint8Array(bytes)
      return { path: path.join(path.basename(filePath), path.relative(filePath, file)), content: data }
    })

    const node = onchfs.files.prepare(fileObjects)
    const dirCIDHex = uint8ArrayToHex(node.cid)
    console.log('Directory CID:', dirCIDHex);

    const inscriptions = await onchfs.inscriptions.prepare(node)
    const batches = onchfs.inscriptions.batch(inscriptions, 32000)

    for (const batch of batches) {
      await writeInscriptions(Tezos, batch)
    }

    console.log('Directory upload completed successfully.');
  } else {
    console.error('Error: Path is neither a file nor a directory.');
    process.exit(1);
  }
}   
