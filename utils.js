import hpack from 'hpack'

export function uint8ArrayToHex(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encodeheaders(headers) {
  const hpack = new hpack();
  const encoded = hpack.encode(headers);
  return encoded;
}
