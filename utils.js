import hpack from 'hpack'
import readline from 'readline'
import { CONFIG } from './config.js'

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

export function decodeHeaders(headers) {
  const hp = new hpack();
  const decoded = hp.decode(headers);
  return decoded;
}

export function hexToUint8Array(hexString) {
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}


export async function writeInscriptions(Tezos, batch) {
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);

//    const methods = onchfsContract.parameterSchema.ExtractSignatures();
//    console.log(JSON.stringify(methods, null, 2));
//
//  return

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
    } else if (inscription.type === 'directory') {
      // Convert files to a map with string keys and bytes values
      const filesMap = Object.fromEntries(
        Object.entries(inscription.files).map(([path, cid]) => [path, '0x' + uint8ArrayToHex(cid)])
      );
      // Add create_directory operation to batch
      batchBuilder = batchBuilder.withContractCall(
        onchfsContract.methodsObject.create_directory(filesMap)
      );
    }
  }

  // Estimate
  const estimates = await Tezos.estimate.batch(batchBuilder.operations);
  const totalFeeMutez = estimates.reduce((sum, est) => sum + est.suggestedFeeMutez, 0);
  const totalFeeInTez = totalFeeMutez / 1_000_000;

  // Confirm cost
  const confirmation = await new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Estimated cost for uploading is ${totalFeeInTez} XTZ. Proceed? (yes/no) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
  if (!confirmation) throw new Error('Upload cancelled by user')

  // Send the batch operation
  const batchOperation = await batchBuilder.send();

  console.log(`Awaiting confirmation for batch operation ${batchOperation.hash}...`);
  await batchOperation.confirmation();
}
