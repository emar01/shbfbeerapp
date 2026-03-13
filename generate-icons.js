const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  try {
    const inputImagePath = path.join(__dirname, 'assets', 'logo.png');
    const outputDir = path.join(__dirname, 'assets', 'icons');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sizes recommended for PWA
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputImagePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    }
    
    console.log('Finished generating icons.');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
