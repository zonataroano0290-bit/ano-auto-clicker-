import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodeRgbPng(width, height, rgbBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB (no alpha channel, required for iOS AppIcon)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type 0
    rgbBuffer.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function fillRect(buf, width, x0, y0, x1, y1, r, g, b) {
  const minX = Math.max(0, Math.floor(x0));
  const minY = Math.max(0, Math.floor(y0));
  const maxX = Math.min(width, Math.ceil(x1));
  const maxY = Math.ceil(y1);

  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const idx = (y * width + x) * 3;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
    }
  }
}

function drawRoundedBorder(buf, width, cx, cy, halfSize, stroke, radius, r, g, b) {
  const outer = halfSize;
  const inner = halfSize - stroke;
  const minX = Math.max(0, Math.floor(cx - outer));
  const maxX = Math.min(width - 1, Math.ceil(cx + outer));
  const minY = Math.max(0, Math.floor(cy - outer));
  const maxY = Math.ceil(cy + outer);

  for (let y = minY; y <= maxY; y += 1) {
    const dy = Math.abs(y - cy);
    for (let x = minX; x <= maxX; x += 1) {
      const dx = Math.abs(x - cx);
      const qx = Math.max(dx - (outer - radius), 0);
      const qy = Math.max(dy - (outer - radius), 0);
      const distOuter = Math.hypot(qx, qy) <= radius;

      const iqx = Math.max(dx - (inner - Math.max(0, radius - stroke)), 0);
      const iqy = Math.max(dy - (inner - Math.max(0, radius - stroke)), 0);
      const insideInner =
        dx <= inner &&
        dy <= inner &&
        Math.hypot(iqx, iqy) <= Math.max(0, radius - stroke);

      if (distOuter && !insideInner) {
        const idx = (y * width + x) * 3;
        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
      }
    }
  }
}

function renderReticle(size, markHalfSize) {
  const buf = Buffer.alloc(size * size * 3, 0); // Pure #000000 background
  const cx = size / 2;
  const cy = size / 2;
  const stroke = Math.max(6, Math.round(markHalfSize * 0.14));
  const radius = Math.round(markHalfSize * 0.24);

  // Outer white rounded square frame
  drawRoundedBorder(buf, size, cx, cy, markHalfSize, stroke, radius, 255, 255, 255);

  // Four precision crosshair ticks
  const tickOuter = markHalfSize * 0.72;
  const tickInner = markHalfSize * 0.34;
  const halfStroke = stroke / 2;

  fillRect(buf, size, cx - halfStroke, cy - tickOuter, cx + halfStroke, cy - tickInner, 255, 255, 255);
  fillRect(buf, size, cx - halfStroke, cy + tickInner, cx + halfStroke, cy + tickOuter, 255, 255, 255);
  fillRect(buf, size, cx - tickOuter, cy - halfStroke, cx - tickInner, cy + halfStroke, 255, 255, 255);
  fillRect(buf, size, cx + tickInner, cy - halfStroke, cx + tickOuter, cy + halfStroke, 255, 255, 255);

  // Minimal red accent center square (#EF4444)
  const centerHalf = Math.round(markHalfSize * 0.14);
  fillRect(
    buf,
    size,
    cx - centerHalf,
    cy - centerHalf,
    cx + centerHalf,
    cy + centerHalf,
    239,
    68,
    68
  );

  return encodeRgbPng(size, size, buf);
}

const outDir = path.resolve('assets');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-only.png'), renderReticle(1024, 340));
const splashPng = renderReticle(2732, 220);
fs.writeFileSync(path.join(outDir, 'splash.png'), splashPng);
fs.writeFileSync(path.join(outDir, 'splash-dark.png'), splashPng);

const iosIconPath = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
if (fs.existsSync(path.dirname(iosIconPath))) {
  fs.copyFileSync(path.join(outDir, 'icon-only.png'), iosIconPath);
}

const iosSplashDir = path.resolve('ios/App/App/Assets.xcassets/Splash.imageset');
if (fs.existsSync(iosSplashDir)) {
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    fs.copyFileSync(path.join(outDir, 'splash.png'), path.join(iosSplashDir, name));
  }
}

console.log('Generated ANOCLIX iOS icon and splash PNG assets.');
