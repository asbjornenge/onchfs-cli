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

export async function calcBatchCost(Tezos, batch) {
  const estimates = await Tezos.estimate.batch(batch.operations)
  const totalFeeMutez = estimates.reduce((sum, est) => sum + est.suggestedFeeMutez + est.burnFeeMutez, 0)
  const totalFeeInTez = totalFeeMutez / 1_000_000;
  return totalFeeInTez
}


export async function confirmCost(totalFeeInTez) {
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
}

export async function buildBatches(Tezos, batches) {
  const tezbatches = []
  for (const batch of batches) {
    const tezbatch = await buildBatch(Tezos, batch)
    tezbatches.push(tezbatch)
  }
  return tezbatches
}

export async function buildBatch(Tezos, batch) {
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);

  let tezbatch = Tezos.contract.batch();

  for (const inscription of batch) {
    switch(inscription.type) {
      case 'chunk':
        const dataHex = '0x' + uint8ArrayToHex(inscription.content);
        tezbatch = tezbatch.withContractCall(onchfsContract.methods.write_chunk(dataHex));
        break
      case 'file':
        const chunkPointers = inscription.chunks.map(chunk => '0x' + uint8ArrayToHex(chunk));
        const metadataHex = '0x' + uint8ArrayToHex(inscription.metadata);
        tezbatch = tezbatch.withContractCall(
          onchfsContract.methodsObject.create_file({
            chunk_pointers: chunkPointers,
            metadata: metadataHex,
          })
        )
        break
      case 'directory':
        const filesMap = Object.fromEntries(
          Object.entries(inscription.files).map(([path, cid]) => [path, '0x' + uint8ArrayToHex(cid)])
        );
        tezbatch = tezbatch.withContractCall(
          onchfsContract.methodsObject.create_directory(filesMap)
        )
        break
      }
    }

    return tezbatch
}

export async function sendBatches(Tezos, batches) {
  for (const batch of batches) {
    const batchOperation = await batch.send();
    console.log(`Awaiting confirmation for batch operation ${batchOperation.hash}...`)
    await batchOperation.confirmation()
  }
}
