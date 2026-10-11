const fs = require('fs');
const path = require('path');

const w = 16, h = 16;

const dir = Buffer.alloc(6);
dir.writeUInt16LE(1, 2); // type = icon
dir.writeUInt16LE(1, 4); // count = 1

const pixels = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    const inside = Math.sqrt(dx * dx + dy * dy) < 7;
    const i = ((h - 1 - y) * w + x) * 4; // BMP хранится снизу вверх
    if (inside) {
      pixels[i] = 0xd6;     // B
      pixels[i + 1] = 0x7a; // G
      pixels[i + 2] = 0x2e; // R
      pixels[i + 3] = 0xff; // A
    }
  }
}

const andMask = Buffer.alloc(64);

const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);
bmpHeader.writeInt32LE(w, 4);
bmpHeader.writeInt32LE(h * 2, 8);
bmpHeader.writeUInt16LE(1, 12);
bmpHeader.writeUInt16LE(32, 14);

const imageData = Buffer.concat([bmpHeader, pixels, andMask]);

const entry = Buffer.alloc(16);
entry[0] = w;
entry[1] = h;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(imageData.length, 8);
entry.writeUInt32LE(22, 12);

fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'favicon.ico'),
  Buffer.concat([dir, entry, imageData])
);
console.log('public/favicon.ico created');
