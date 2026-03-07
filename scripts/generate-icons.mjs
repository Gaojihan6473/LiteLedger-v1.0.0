import sharp from 'sharp';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

const sizes = [192, 512];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#3b82f6"/>
  <text x="50" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">账</text>
</svg>`;

async function generateIcons() {
  for (const size of sizes) {
    const filename = `icon-${size}.png`;
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, filename));
    console.log(`Generated ${filename}`);
  }
}

generateIcons().catch(console.error);
