import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import {
  CONFIG,
  ONCHFSCLI_TEZOS_PRIVATE_KEY
} from './config.js'

export function prepareWallet() {
  const Tezos = new TezosToolkit(CONFIG.network.RPC);
  Tezos.setProvider({
    signer: new InMemorySigner(ONCHFSCLI_TEZOS_PRIVATE_KEY),
  });
  return Tezos
}
