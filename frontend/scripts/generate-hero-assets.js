import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputs = [
  { name: 'heroB', file: './src/assets/HeroB.png' },
  { name: 'heroW', file: './src/assets/heroW.png' }
];

// Ensure the converted directory exists
const outputDir = './src/assets/converted';
if (!fs.existsSync(outputDir)) {
  try {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  } catch (err) {
    console.error(`Error creating directory: ${outputDir}`, err);
  }
}

// Log available files to help debug
try {
  const files = fs.readdirSync('./src/assets');
  console.log('Available files in ./src/assets:', files);
} catch (err) {
  console.error('Error reading directory:', err);
}

async function makeVariants() {
  for (let {name, file} of inputs) {
    console.log(`Processing ${file}...`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        continue;
      }
      
      // Delete existing files if they exist to avoid write errors
      const outputFiles = [
        `${outputDir}/${name}.png`,
        `${outputDir}/${name}@2x.png`, 
        `${outputDir}/${name}.webp`,
        `${outputDir}/${name}@2x.webp`
      ];
      
      for (const outputFile of outputFiles) {
        if (fs.existsSync(outputFile)) {
          try {
            fs.unlinkSync(outputFile);
            console.log(`Deleted existing file: ${outputFile}`);
          } catch (err) {
            console.error(`Failed to delete file: ${outputFile}`, err);
          }
        }
      }
      
      const img = sharp(file);
      const metadata = await img.metadata();
      console.log(`Image metadata:`, metadata);

      // 1× PNG
      await img
        .clone()
        .png()
        .toFile(`${outputDir}/${name}.png`);

      // 2× PNG
      await img
        .clone()
        .resize({ width: metadata.width * 2, height: metadata.height * 2 })
        .png()
        .toFile(`${outputDir}/${name}@2x.png`);

      // 1× WebP
      await img
        .clone()
        .webp({ quality: 80 })
        .toFile(`${outputDir}/${name}.webp`);

      // 2× WebP
      await img
        .clone()
        .resize({ width: metadata.width * 2, height: metadata.height * 2 })
        .webp({ quality: 80 })
        .toFile(`${outputDir}/${name}@2x.webp`);
        
      console.log(`Successfully processed ${file}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

makeVariants()
  .then(() => console.log('Hero asset variants generated.'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  }); 