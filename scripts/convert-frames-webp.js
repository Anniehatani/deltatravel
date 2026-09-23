const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.resolve(__dirname, '../apps/web/public/frames');
if (!fs.existsSync(dir)) {
  console.error('Directory not found:', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
console.log('Found PNG files:', files.length);

async function convertAll() {
  let totalPngSize = 0;
  let totalWebpSize = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(dir, file);
    const destPath = path.join(dir, file.replace(/\.png$/, '.webp'));
    
    const pngStat = fs.statSync(srcPath);
    totalPngSize += pngStat.size;
    
    await sharp(srcPath)
      .webp({ quality: 85, effort: 4 })
      .toFile(destPath);
      
    const webpStat = fs.statSync(destPath);
    totalWebpSize += webpStat.size;
    
    if ((i + 1) % 30 === 0 || i === files.length - 1) {
      console.log(`Converted ${i + 1}/${files.length} frames...`);
    }
  }
  
  console.log('PNG Total:', (totalPngSize / (1024 * 1024)).toFixed(2), 'MB');
  console.log('WebP Total:', (totalWebpSize / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Reduction:', ((1 - totalWebpSize / totalPngSize) * 100).toFixed(1) + '%');
}

convertAll().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
