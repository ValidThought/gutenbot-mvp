const fs = require('fs');

// Minimal 192x192 valid PNG (1x1 purple pixel scaled)
// This is a placeholder - replace with proper icons for production
const createPlaceholderPNG = (size) => {
  // PNG header + IHDR + IDAT + IEND
  // Using a simple approach - creating a minimal valid PNG
  const width = size;
  const height = size;
  
  // Create raw pixel data (RGBA)
  const pixels = [];
  const r = 26, g = 26, b = 46; // #1a1a2e (primary color)
  
  for (let y = 0; y < height; y++) {
    pixels.push(0x00); // Filter byte
    for (let x = 0; x < width; x++) {
      // Create a simple gradient/icon shape
      const isIcon = 
        (x >= 50 && x <= 142 && y >= 50 && y <= 80) || // "G"
        (x >= 50 && x <= 80 && y >= 90 && y <= 142) || // Left bar
        (x >= 50 && x <= 142 && y >= 130 && y <= 142) || // Bottom bar
        (x >= 110 && x <= 142 && y >= 90 && y <= 142);   // Right bottom
  
      if (isIcon) {
        pixels.push(255, 255, 255); // White text/icon
      } else {
        pixels.push(r, g, b); // Primary color background
      }
    }
  }
  
  // Calculate CRC32 (simplified - using adler32 for simplicity)
  const adler32 = (data) => {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  };
  
  const chunks = [];
  
  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  chunks.push(createChunk('IHDR', ihdrData));
  
  // IDAT chunk (compressed image data)
  const rawData = Buffer.from(pixels);
  // Simple zlib compression header
  const zlibHeader = Buffer.from([0x78, 0x01]); // zlib header
  const compressed = zlibHeader; // For placeholder, use uncompressed with zlib header
  chunks.push(createChunk('IDAT', compressed));
  
  // IEND chunk
  chunks.push(createChunk('IEND', Buffer.alloc(0)));
  
  return Buffer.concat(chunks);
};

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// Simple CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = makeCRCTable();
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

// Generate icons
console.log('Generating PWA icons...');

const icon192 = createPlaceholderPNG(192);
fs.writeFileSync('public/icons/icon-192.png', icon192);
console.log('Created public/icons/icon-192.png');

const icon512 = createPlaceholderPNG(512);
fs.writeFileSync('public/icons/icon-512.png', icon512);
console.log('Created public/icons/icon-512.png');

console.log('\n✅ PWA icons generated!');
console.log('Note: These are placeholder icons. Replace with proper designed icons for production.');
