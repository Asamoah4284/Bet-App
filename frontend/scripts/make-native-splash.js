const sharp = require('sharp');
const path = require('path');

const mark = path.join('assets', 'images', 'logo-mark.png');
const markWhite = path.join('assets', 'images', 'logo-mark-white.png');
const outLight = path.join('assets', 'images', 'splash-native.png');
const outDark = path.join('assets', 'images', 'splash-native-dark.png');

async function gradientBuffer(width, height, stops) {
  const [c0, c1, c2] = stops;
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stop-color="${c0}"/>
        <stop offset="45%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`);
  return sharp(svg).png().toBuffer();
}

(async () => {
  const size = 1280;
  const logoSize = Math.round(size * 0.42);

  const lightBg = await gradientBuffer(size, size, ['#E9EEF5', '#F7F9FC', '#EAF4F2']);
  const darkBg = await gradientBuffer(size, size, ['#1A1F27', '#14161A', '#15221A']);
  const logoInk = await sharp(mark).resize(logoSize, logoSize).png().toBuffer();
  const logoW = await sharp(markWhite).resize(logoSize, logoSize).png().toBuffer();

  await sharp(lightBg)
    .composite([{ input: logoInk, gravity: 'center' }])
    .png()
    .toFile(outLight);

  await sharp(darkBg)
    .composite([{ input: logoW, gravity: 'center' }])
    .png()
    .toFile(outDark);

  console.log('wrote', outLight, outDark);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
