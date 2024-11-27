# OnchFS CLI

OnchFS CLI is a command-line interface tool for interacting with the OnchFS decentralized file storage system on the Tezos blockchain. It allows users to upload and download files securely using Tezos smart contracts.

## Features

- **Upload Files:** Upload files to the OnchFS network with ease.
- **Download Files:** Retrieve files using their unique Content Identifier (CID).
- **Batch Operations:** Efficiently handle large batches of inscriptions.
- **Cost Estimation:** Automatically estimates the cost of uploads before proceeding.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/onchfs-cli.git
   cd onchfs-cli
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   
   Create a `.env` file in the root directory and set the following variables:
   ```
   TEZOS_RPC=https://ghostnet.smartpy.io
   TEZOS_PRIVATE_KEY=your_private_key_here
   ONCHFS_CONTRACT_ADDRESS=KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q
   MAX_FILE_SIZE=32000
   ```

## Usage

The CLI supports two primary operations: `put` to upload files and `get` to download files.

### Upload a File

To upload a file to the OnchFS network:

```bash
onchfs put <file_path>
```

**Example:**
```bash
onchfs put index.html
```

### Download a File

To download a file from the OnchFS network using its CID:

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

## Configuration

Configuration is managed via environment variables. Ensure all required variables are set correctly in the `.env` file before using the CLI.

- `TEZOS_RPC`: The Tezos node RPC URL.
- `TEZOS_PRIVATE_KEY`: Your Tezos account private key.
- `ONCHFS_CONTRACT_ADDRESS`: The address of the OnchFS smart contract.
- `MAX_FILE_SIZE`: Maximum allowed file size for uploads in bytes.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Taquito](https://tezostaquito.io/) for Tezos JavaScript libraries.
- [OnchFS](https://onchfs.com/) for decentralized file storage solutions.
- Open-source community for continuous support and contributions.

# Support

For any issues or questions, please open an issue on the [GitHub repository](https://github.com/yourusername/onchfs-cli/issues).

# Author

[Your Name](https://github.com/yourusername)
