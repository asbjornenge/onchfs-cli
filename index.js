import minimist from 'minimist'
import {
  TEZOS_PRIVATE_KEY,
} from './config.js'
import { upload } from './upload.js'
import { download } from './download.js'
import { prepareWallet } from './wallet.js'

// TODO: mainnet and ghostnet

if (!TEZOS_PRIVATE_KEY) {
  console.error('Please set environment variable TEZOS_PRIVATE_KEY.');
  process.exit(1);
}
const Tezos = prepareWallet()

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: [],
    alias: { 
      h: 'help',
    },
    default: {
      h: false,
    }
  })

  // TODO: parse from README.md
  if (args.help) {
    console.log(`Usage: onchfs [options] [method] [file/cid]

    Options:
      -h, --help        Show help information

    Positional Arguments:
      method      put or get
      file        file to upload 
      cid         cid to download

    Examples:
      onchfs put index.html 
      onchfs get 66aa60d77334e46ca630878c0b24f55f799682b38f7e5d7bfa97d5e421fe762d
    `)
    process.exit(0)
  }

  if (args._.length < 2) {
    console.log('You need to provide both a method and a file or cid.')
    process.exit(0)
  }

  const instruction = args._[0]
  const filePath = args._[1]

  if (!['put', 'get'].includes(instruction)) {
    console.log(`Unknown instruction ${instruction}. Supported instructions are put and get.`)
    process.exit(0)
  }

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
    console.error(error)
    process.exit(1)
  }
}

main();

