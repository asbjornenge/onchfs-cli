import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import {
  TEZOS_RPC,
  TEZOS_PRIVATE_KEY,
} from './config.js'

export function prepareWallet() {
  const Tezos = new TezosToolkit(TEZOS_RPC);
  Tezos.setProvider({
    signer: new InMemorySigner(TEZOS_PRIVATE_KEY),
  });
  return Tezos
}
