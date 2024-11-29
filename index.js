#!/usr/bin/env node
import minimist from 'minimist'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  CONFIG,
  set_config,
  set_network,
  ONCHFSCLI_TEZOS_PRIVATE_KEY
} from './config.js'
import { upload } from './upload.js'
import { download } from './download.js'
import { prepareWallet } from './wallet.js'

// TODO: MAX_FILE_SIZE is that for files or just for chunks?

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!ONCHFSCLI_TEZOS_PRIVATE_KEY) {
  console.error('Please set environment variable ONCHFSCLI_TEZOS_PRIVATE_KEY.');
  process.exit(1);
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: [],
    alias: { 
      r: 'rpc',
      h: 'help',
      n: 'network'
    },
    default: {
      h: false,
    }
  })

  if (args.help) {
    const readmeContent = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf-8');
    const usageSection = readmeContent.match(/## Usage[\s\S]*?```([\s\S]*?)```/);
    console.log(usageSection[1].trim());
    process.exit(0)
  }

  if (args._.length < 2) {
    console.log('You need to provide both a method and a file or cid.')
    process.exit(0)
  }

  if (args.r) try { set_config('rpc', args.r) } catch(e) { console.error(e.message); process.exit(1) }
  if (args.n) try { set_network(args.n) } catch(e) { console.error(e.message); process.exit(1) }

  const instruction = args._[0]
  const filePath = args._[1]

  if (!['put', 'get'].includes(instruction)) {
    console.log(`Unknown instruction ${instruction}. Supported instructions are put and get.`)
    process.exit(0)
  }

  const Tezos = prepareWallet()

  if (instruction == 'put') {
    console.log(`Network: ${CONFIG.network.key}`)
    console.log(`RPC: ${CONFIG.rpc || CONFIG.network.RPC}`)
  }

  try {
    switch(instruction) {
      case 'put':
        await upload({ Tezos, filePath })
        break;
      case 'get':
        await download({ Tezos, URI: filePath })
        break;
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

main();
