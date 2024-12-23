import fs from 'fs' 
import path from 'path'
import mime from 'mime'
import onchfs from './onchfs.js'
import { 
  confirmCost,
  sendBatches,
  buildBatches,
  encodeHeaders,
  calcBatchCost,
  uint8ArrayToHex, 
} from './utils.js'
import {
  getNetwork
} from './utils.js'
import { ethers } from 'ethers'

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

export async function upload({ wallet, filePath }) {
  const network = getNetwork()
  const netname = network.key.split(':')[0]
  switch (netname) {
    case 'tezos':
      await uploadTezos({ Tezos: wallet, filePath, network })
      break
    case 'ethereum':
      await uploadEthereum({ wallet, filePath, network })
      break
    default:
      throw new Error('Unsupported network')
  } 

}

export async function uploadTezos({ Tezos, filePath, network }) {
  const stats = fs.statSync(filePath);

  if (stats.isFile()) {
    const bytes = fs.readFileSync(filePath)
    const data = new Uint8Array(bytes)
    const node = onchfs.files.prepare({ path: path.basename(filePath), content: data })
    const fileCIDHex = uint8ArrayToHex(node.cid)
    console.log('CID:', fileCIDHex);

    const inscriptions = await onchfs.inscriptions.prepare(node)
    const batches = onchfs.inscriptions.batch(inscriptions, network.BATCH_SIZE_LIMIT)
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
    const batches = onchfs.inscriptions.batch(inscriptions, network.BATCH_SIZE_LIMIT)
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

export async function uploadEthereum({ wallet, filePath, network }) {
  const provider = wallet.provider;
  const signer = wallet;
  const contractAddress = network.ONCHFS_CONTRACT_ADDRESS;
  const contractABI = [
    // Replace with the actual ABI of the ONCHFS contract
    "function write_chunk(bytes32 chunk) public",
    "function create_file(bytes32[] chunkPointers, bytes metadata) public",
    "function create_directory(bytes32[] fileCIDs) public"
  ];
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  const stats = fs.statSync(filePath);

  if (stats.isFile()) {
    const bytes = fs.readFileSync(filePath)
    const data = new Uint8Array(bytes)
    const node = onchfs.files.prepare({ path: path.basename(filePath), content: data })
    const fileCIDHex = uint8ArrayToHex(node.cid)
    console.log('CID:', fileCIDHex);

    const inscriptions = await onchfs.inscriptions.prepare(node)
    const batches = onchfs.inscriptions.batch(inscriptions, network.BATCH_SIZE_LIMIT)

    let totalGas = 0
    for (const batch of batches) {
      const gas = await contract.estimateGas.create_file(batch.chunkPointers, batch.metadata)
      totalGas += gas.toNumber()
    }

    console.log(`Estimated total gas cost: ${totalGas}`)
    await confirmCost(totalGas)

    for (const batch of batches) {
      const tx = await contract.create_file(batch.chunkPointers, batch.metadata)
      console.log(`Transaction sent: ${tx.hash}`)
      await tx.wait()
      console.log(`Transaction confirmed: ${tx.hash}`)
    }

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
    const batches = onchfs.inscriptions.batch(inscriptions, network.BATCH_SIZE_LIMIT)

    let totalGas = 0
    for (const batch of batches) {
      const gas = await contract.estimateGas.create_directory(batch.fileCIDs)
      totalGas += gas.toNumber()
    }

    console.log(`Estimated total gas cost: ${totalGas}`)
    await confirmCost(totalGas)

    for (const batch of batches) {
      const tx = await contract.create_directory(batch.fileCIDs)
      console.log(`Transaction sent: ${tx.hash}`)
      await tx.wait()
      console.log(`Transaction confirmed: ${tx.hash}`)
    }

    console.log('Directory upload completed successfully.');
  } else {
    console.error('Error: Path is neither a file nor a directory.');
    process.exit(1);
  }
}

