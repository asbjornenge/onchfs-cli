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

// ABIs
const MULTICALL3_ABI = [
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) external payable returns (bytes[] memory returnData)"
];
const CONTENT_STORE_ABI = [
  "function addContent(bytes content) external returns (bytes32 checksum, address pointer)"
];
const FILE_SYSTEM_ABI = [
  "function createFile(bytes _metadata, bytes32[] _chunkChecksums) external returns (bytes32 fileChecksum)",
  "function createDirectory(string[] calldata _names, bytes32[] calldata _inodeChecksums) external returns (bytes32 directoryChecksum)"
];

export async function uploadEthereum({ wallet, filePath, network }) {
  // The addresses for each contract:
  const multicallAddress = network.MULTICALL3_CONTRACT_ADDRESS;
  const contentStoreAddress = network.CONTENT_STORE_ADDRESS;
  const fileSystemAddress  = network.FILE_SYSTEM_ADDRESS;

  if (!multicallAddress || !contentStoreAddress || !fileSystemAddress) {
    throw new Error(`Missing contract addresses in network config`);
  }

  const signer = wallet;
  const multicall = new ethers.Contract(multicallAddress, MULTICALL3_ABI, signer);
  const contentStore = new ethers.Contract(contentStoreAddress, CONTENT_STORE_ABI, signer);
  const fileSystem = new ethers.Contract(fileSystemAddress, FILE_SYSTEM_ABI, signer);

  const stats = fs.statSync(filePath);

  if (stats.isFile()) {
    //
    // 1) Prepare “file” node with onchfs
    //
    const bytes = fs.readFileSync(filePath);
    const data = new Uint8Array(bytes);

    // Create a single “file” inode object
    const fileNode = onchfs.files.prepare({
      path: path.basename(filePath),
      content: data
    });
    console.log('CID:', Buffer.from(fileNode.cid).toString('hex'));

    // 2) Prepare inscriptions (chunks, plus final file inode)
    const inscriptions = await onchfs.inscriptions.prepare(fileNode);

    // 3) Batch them to keep each call below the size limit
    const batches = onchfs.inscriptions.batch(inscriptions, network.BATCH_SIZE_LIMIT);

    //
    // 4) Build the calls array to store chunks first, then createFile.
    //
    // A typical batch might contain multiple “chunk” inscriptions plus
    // the “file” inscription (with metadata & chunk checksums).
    //
    const calls = [];
    for (const batch of batches) {
      // In each batch, you can do:
      // - For each chunk => contentStore.addContent(...)
      // - Then fileSystem.createFile(...) once all chunk checksums are known.
      //
      // HOWEVER, if you rely on the chain logs to discover the chunk checksums,
      // that implies a two-step process. If you want everything in *one TX*,
      // you must precompute each chunk’s keccak256 offline, because
      // contentStore.addContent(...) just does keccak256 anyway.
      //
      // For demonstration, we’ll do everything in one batch:
      //  a) addContent(...) for each chunk
      //  b) createFile(...) with chunkChecksums
      //
      // We can see which inscriptions in the batch are “chunk” vs “file”:
      const chunkIns = batch.filter(i => i.type === 'chunk');
      const fileIns  = batch.find(i => i.type === 'file');

      // For each chunk inscription
      chunkIns.forEach(chunk => {
        const callData = contentStore.interface.encodeFunctionData('addContent', [chunk.content]);
        calls.push({
          target: contentStoreAddress,
          allowFailure: false,
          callData
        });
      });

      // Then the “file” inscription
      if (fileIns) {
        // We must pass precomputed checksums for each chunk. 
        // onchfs already stores `chunk.hash` as the keccak-256. That’s
        // exactly what addContent(...) emits as `checksum`.
        // So we can use chunk.hash directly.
//        const chunkChecksums = chunkIns.map(ch => '0x' + Buffer.from(ch.hash).toString('hex'));

        const chunkChecksums = fileIns.chunks.map(
          hashBytes => '0x' + Buffer.from(hashBytes).toString('hex')
        );

        // The metadata is a bytes array. If it’s a standard typed array, 
        // we can pass it directly or convert to hex string.
        const metadataHex = '0x' + Buffer.from(fileIns.metadata).toString('hex');

        const fileData = fileSystem.interface.encodeFunctionData("createFile", [
          metadataHex,
          chunkChecksums
        ]);
        calls.push({
          target: fileSystemAddress,
          allowFailure: false,
          callData: fileData
        });
      }
    }

    // 5) Estimate & send via multicall
    const gas = await multicall.aggregate3.estimateGas(calls);
    console.log(`Estimated total gas cost: ${gas.toString()}`);
    // optionally confirm the cost
    const tx = await multicall.aggregate3(calls, { gasLimit: gas * 2n });
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log('File upload completed successfully.');
  }
  else if (stats.isDirectory()) {
    //
    // Same idea, but you’ll have “directory” inscriptions plus nested files & chunks.
    //
    console.log("Upload directory - same approach, but calls createDirectory(...) at the end.");
  }
  else {
    console.error('Error: Path is neither a file nor a directory.');
    process.exit(1);
  }
}

