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

  // console.log the file 
  console.log(Buffer.from(fileData).toString('utf-8'))
}
