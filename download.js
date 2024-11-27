import zlib from 'zlib';
import onchfs from 'onchfs'
import {
  ONCHFS_CONTRACT_ADDRESS
} from './config.js'
import {
  decodeHeaders,
  hexToUint8Array 
} from './utils.js'

export async function download({ Tezos, cid }) {
  const onchfsContract = await Tezos.contract.at(ONCHFS_CONTRACT_ADDRESS);

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
