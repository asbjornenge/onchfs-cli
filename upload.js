import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import onchfs from './onchfs.js'
import { CONFIG } from './config.js'
import { 
  confirmCost,
  sendBatches,
  buildBatches,
  encodeHeaders,
  calcBatchCost,
  uint8ArrayToHex, 
} from './utils.js'

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
    const bytes = fs.readFileSync(filePath)
    const data = new Uint8Array(bytes)
    const node = onchfs.files.prepare({ path: path.basename(filePath), content: data })
    const fileCIDHex = uint8ArrayToHex(node.cid)
    console.log('CID:', fileCIDHex);

    const inscriptions = await onchfs.inscriptions.prepare(node)
    const batches = onchfs.inscriptions.batch(inscriptions, CONFIG.network.BATCH_SIZE_LIMIT)
    const tezbatches = await buildBatches(Tezos, batches)
    const batchcost = await calcBatchCost(Tezos, tezbatches[0])

    console.log(`A total of ${tezbatches.length} batch operations is required.`)
    await confirmCost(batchcost * tezbatches.length)
    await sendBatches(Tezos, tezbatches)

    console.log('File upload completed successfully.');
  } else if (stats.isDirectory()) {
    const files = getAllFilesSync(filePath)

    const fileObjects = files.map(file => {
      const bytes = fs.readFileSync(file)
      const data = new Uint8Array(bytes)
      return { path: path.join(path.basename(filePath), path.relative(filePath, file)), content: data }
    })

    const node = onchfs.files.prepare(fileObjects)
    const dirCIDHex = uint8ArrayToHex(node.cid)
    console.log('Directory CID:', dirCIDHex);

    const inscriptions = await onchfs.inscriptions.prepare(node)
    const batches = onchfs.inscriptions.batch(inscriptions, CONFIG.network.BATCH_SIZE_LIMIT)
    const tezbatches = await buildBatches(Tezos, batches)
    const batchcost = await calcBatchCost(Tezos, tezbatches[0])

    console.log(`A total of ${tezbatches.length} batch operations is required.`)
    await confirmCost(batchcost * tezbatches.length)
    await sendBatches(Tezos, tezbatches)

    console.log('Directory upload completed successfully.');
  } else {
    console.error('Error: Path is neither a file nor a directory.');
    process.exit(1);
  }
}   
