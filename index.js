import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import {
  TEZOS_RPC,
  TEZOS_PRIVATE_KEY,
  ONCHFS_CONTRACT_ADDRESS
} from './config.js'
import { upload } from './upload.js'
import { prepareWallet } from './wallet.js'

if (!TEZOS_PRIVATE_KEY) {
  console.error('Please set environment variable TEZOS_PRIVATE_KEY.');
  process.exit(1);
}
const Tezos = prepareWallet()

async function main() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node uploadFile.js <file_path>');
    process.exit(1);
  }

  try {
    await upload({ Tezos, filePath })
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
