import zlib from 'zlib';
import onchfs from 'onchfs'
import { CONFIG } from './config.js'
import {
  decodeHeaders,
  hexToUint8Array 
} from './utils.js'

async function read_file({ Tezos, URI }) {
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);
  const cid = URI.split('onchfs://')[1]
  const fileInode = await onchfsContract.contractViews
    .read_file('0x' + cid)
    .executeView({ viewCaller: 'tz1burnburnburnburnburnburnburjAYjjX' });

  const contentHex = fileInode.content;
  const metadataHex = fileInode.metadata;
  const metadataBytes = hexToUint8Array(metadataHex);
  const headers = decodeHeaders(metadataBytes);
  const fileData = hexToUint8Array(contentHex);
  const isGzipped = headers.filter(h => h[0] === 'content-encoding' && h[1] === 'gzip').length > 0

  let data = Buffer.from(fileData).toString('utf-8')
  if (isGzipped) data = zlib.gunzipSync(Buffer.from(fileData))
  process.stdout.write(data)
}

async function read_dir({ Tezos, URI }) {
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);
  const cid = URI.split('onchfs://')[1].slice(0, -1)
  const dirInode = await onchfsContract.contractViews
    .read_directory('0x' + cid)
    .executeView({ viewCaller: 'tz1burnburnburnburnburnburnburjAYjjX' });
  const data = JSON.stringify(dirInode, null, 2)
  process.stdout.write(data)
}

export async function download({ Tezos, URI }) {
  if (!URI.startsWith('onchfs://')) throw new Error('Invalid URI. Must start with onchfs://')
  const isdir = URI.endsWith('/')
  if (!isdir) read_file({ Tezos, URI })
  else read_dir({ Tezos, URI })
}
