import minimist from 'minimist'
import fs from 'fs'
import path from 'path'
import {
  set_config,
  set_network,
  ONCHFSCLI_TEZOS_PRIVATE_KEY
} from './config.js'
import { upload } from './upload.js'
import { download } from './download.js'
import { prepareWallet } from './wallet.js'

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
    const readmeContent = fs.readFileSync(path.resolve(__dirname, 'README.md'), 'utf-8');
    const usageSection = readmeContent.match(/## Usage([\s\S]*?)## Contributing/);
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

  try {
    switch(instruction) {
      case 'put':
        await upload({ Tezos, filePath })
        break;
      case 'get':
        await download({ Tezos, cid: filePath })
        break;
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

main();
