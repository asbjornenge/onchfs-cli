import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from  '@taquito/signer'
import { ethers } from 'ethers'
import {
  CONFIG,
  ONCHFSCLI_TEZOS_PRIVATE_KEY,
  ONCHFSCLI_ETHEREUM_PRIVATE_KEY
} from './config.js'
import {
  getRPC,
  getNetwork
} from './utils.js'

export function prepareWallet() {
  const rpc = getRPC() 
  const network = getNetwork()
  const netname = network.key.split(':')[0]
  let wallet;
  switch (netname) {
    case 'tezos':
      wallet = prepareTezosWallet({ rpc })
      break
    case 'ethereum':
      wallet = prepareEthereumWallet({ rpc })
      break
    default:
      throw new Error('Unsupported network')
  } 
  return wallet
}

function prepareTezosWallet({ rpc }) {
  if (!ONCHFSCLI_TEZOS_PRIVATE_KEY) throw new Error('Please set environment variable ONCHFSCLI_TEZOS_PRIVATE_KEY.')
  const Tezos = new TezosToolkit(rpc)
  Tezos.setProvider({
    signer: new InMemorySigner(ONCHFSCLI_TEZOS_PRIVATE_KEY),
  });
  return Tezos
}

function prepareEthereumWallet({ rpc }) {
  if (!ONCHFSCLI_ETHEREUM_PRIVATE_KEY) throw new Error('Please set environment variable ONCHFSCLI_ETHEREUM_PRIVATE_KEY for Ethereum networks.')
  const provider = new ethers.providers.JsonRpcProvider(rpc)
  const wallet = new ethers.Wallet(ONCHFSCLI_ETHEREUM_PRIVATE_KEY, provider)
  return wallet
}
