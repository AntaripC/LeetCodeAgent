import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, renderPixel) {
  // RGBA buffer with filter byte per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      const byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const mix = (crc ^ (byte >> j)) & 1;
        crc = (crc >>> 1) ^ (mix ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const chunkDataForCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(chunkDataForCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw a stylized badge: deep dark background, rounded square, vibrant orange LeetCode accent & cyan AI sparkles
function renderIconPixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;

  // Normalized distance from center
  const dx = (x + 0.5 - cx) / (size * 0.5);
  const dy = (y + 0.5 - cy) / (size * 0.5);
  const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));

  // Rounded rectangle mask
  const rx = Math.abs(x + 0.5 - cx);
  const ry = Math.abs(y + 0.5 - cy);
  const cornerR = size * 0.22;
  const innerW = size * 0.46 - cornerR;
  const innerH = size * 0.46 - cornerR;

  const qx = Math.max(0, rx - innerW);
  const qy = Math.max(0, ry - innerH);
  const distToEdge = Math.sqrt(qx * qx + qy * qy) - cornerR;

  if (distToEdge > 0.5) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  const alpha = distToEdge < -0.5 ? 255 : Math.floor((0.5 - distToEdge) * 255);

  // Background gradient: dark indigo-charcoal (#131722 -> #1a2030)
  const normY = y / size;
  let bgR = Math.floor(18 + normY * 12);
  let bgG = Math.floor(22 + normY * 16);
  let bgB = Math.floor(34 + normY * 20);

  // Draw code chevron "< / >" or "AI" symbol in center
  // Left bracket '<': (cx - size*0.25, cy)
  const nx = (x + 0.5 - cx) / size;
  const ny = (y + 0.5 - cy) / size;

  // LeetCode iconic orange #FFA116 + AI Cyan #00E5FF
  // Left chevron '<'
  const inLeftChevron = (
    nx >= -0.32 && nx <= -0.08 &&
    Math.abs(Math.abs(ny) * 2 - ((-nx) - 0.12)) < 0.08
  );

  // Right chevron '>'
  const inRightChevron = (
    nx >= 0.08 && nx <= 0.32 &&
    Math.abs(Math.abs(ny) * 2 - (nx - 0.12)) < 0.08
  );

  // Center slash '/' or spark
  const inSlash = (
    Math.abs(ny + nx * 1.8) < 0.06 &&
    Math.abs(ny) < 0.28
  );

  if (inLeftChevron || inRightChevron) {
    // LeetCode Gold/Orange
    return [255, 161, 22, alpha];
  }

  if (inSlash) {
    // AI Cyan
    return [0, 229, 255, alpha];
  }

  // Border highlight
  if (distToEdge > -1.5) {
    return [60, 75, 105, alpha];
  }

  return [bgR, bgG, bgB, alpha];
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

[16, 32, 48, 128].forEach(size => {
  const buf = createPNG(size, size, (x, y) => renderIconPixel(x, y, size));
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${filePath} (${buf.length} bytes)`);
});
