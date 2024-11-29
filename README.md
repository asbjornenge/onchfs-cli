# onchfs-cli

`onchfs-cli` is a cli tool for interacting with the [onchfs](https://onchfs.com/) - an on-chain file storage system developed by [fxhash](https://fxhash.xyz). It allows users to upload and download files securely using Tezos smart contracts.

*WORK IN PROGRESS*

For now, we only support the [Tezos](https://tezos.com) blockchain. But would accept PRs for more chains.

## Installation

```
npm install -g onchfs-cli
```

## Setup

In order to use the `onchfs` cli you need to set a Tezos wallet. For now we only support setting a privkey as env variable (yes yes, make a separate wallet only for this purpose OR sumbit a PR to make it more secure).

```
export ONCHFSCLI_TEZOS_PRIVATE_KEY edsk...
```

## Usage

The CLI supports two primary operations: `put` to upload files and `get` to download files.

```
Usage: onchfs [options] [method] [file/cid]

    Options:
      -r, --rpc         Set a custom RPC endpoint
      -h, --help        Show help information
      -n, --network     Network to interact with (default: tezos:mainnet)
                        tezos:mainnet
                        tezos:ghostnet

    Positional Arguments:
      method      put or get
      file        file to upload
      cid         cid to download

    Examples:
      onchfs put index.html
      onchfs get 66aa60d77334e46ca630878c0b24f55f799682b38f7e5d7bfa97d5e421fe762d
```

## TODO

* Add ability to download dirs
* Support more chains (will gladly accept PRs)
* Use resolver instead of calling views for files & dirs? (would work cross-chain)

## License

This project is licensed under the BSD License.

## Acknowledgements

- [Taquito](https://tezostaquito.io/) - Tezos JavaScript libraries
- [onchfs](https://onchfs.com/) - on-chain file storage system 

# Author

[@asbjornenge](https://github.com/asbjornenge)

enjoy.
