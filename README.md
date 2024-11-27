# onchfs-cli

`onchfs-cli` is a command-line interface tool for interacting with the [onchfs](https://onchfs.com/) decentralized file storage system on the Tezos blockchain. It allows users to upload and download files securely using Tezos smart contracts.

## Features

- **Upload Files:** Upload files to the onchfs network with ease.
- **Download Files:** Retrieve files using their unique Content Identifier (CID).
- **Batch Operations:** Efficiently handle large batches of inscriptions.
- **Cost Estimation:** Automatically estimates the cost of uploads before proceeding.

## Installation

```
npm install -g onchfs-cli
```

## Usage

The CLI supports two primary operations: `put` to upload files and `get` to download files.

### Upload a File

To upload a file to the onchfs network:

```bash
onchfs put <file_path>
```

**Example:**
```bash
onchfs put index.html
```

### Download a File

To download a file from the onchfs network using its CID:

```bash
onchfs get <cid>
```

**Example:**
```bash
onchfs get 66aa60d77334e46ca630878c0b24f55f799682b38f7e5d7bfa97d5e421fe762d
```

## Options

- `-h, --help`: Show help information.

**Example:**
```bash
onchfs --help
```

## Examples

- **Uploading a File:**
  ```bash
  onchfs put example.pdf
  ```

- **Downloading a File:**
  ```bash
  onchfs get abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def1
  ```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the BSD License.

## Acknowledgements

- [Taquito](https://tezostaquito.io/) for Tezos JavaScript libraries.
- [onchfs](https://onchfs.com/) for decentralized file storage solutions.
- Open-source community for continuous support and contributions.

# Support

For any issues or questions, please open an issue on the [GitHub repository](https://github.com/asbjornenge/onchfs-cli/issues).

# Author

[@asbjornenge](https://github.com/asbjornenge)

enjoy.
