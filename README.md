# onchfs-cli

`onchfs-cli` is a command-line interface tool for interacting with the [onchfs](https://onchfs.com/) on-chain file storage system on the Tezos blockchain. It allows users to upload and download files securely using Tezos smart contracts.

## Installation

```
npm install -g onchfs-cli
```

## Usage

The CLI supports two primary operations: `put` to upload files and `get` to download files.

To upload a file to the onchfs network:

```bash
onchfs put <file_path>
```

To download a file from the onchfs network using its CID:

```bash
onchfs get <cid>
```

## Options

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

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the BSD License.

## Acknowledgements

- [Taquito](https://tezostaquito.io/) - Tezos JavaScript libraries
- [onchfs](https://onchfs.com/) - on-chain file storage system 

# Support

For any issues or questions, please open an issue on the [GitHub repository](https://github.com/asbjornenge/onchfs-cli/issues).

# Author

[@asbjornenge](https://github.com/asbjornenge)

enjoy.
