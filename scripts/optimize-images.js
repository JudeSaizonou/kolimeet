import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const IMAGE_SIZES = [320, 640, 1024, 1920];
const INPUT_DIR = 'public/images';
const QUALITY = 85;

async function optimizeImage(filePath, fileName) {
  const { name, ext } = parse(fileName);
  
  // Skip if already a WebP or optimized file
  if (ext === '.webp' || fileName.includes('-') && fileName.includes('w.webp')) {
    console.log(`⏭️  Skipping ${fileName} (already optimized)`);
    return;
  }
  
  // Only process image files
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext.toLowerCase())) {
    console.log(`⏭️  Skipping ${fileName} (not an image)`);
    return;
  }
  
  console.log(`🖼️  Optimizing ${fileName}...`);
  
  try {
    // Get original dimensions
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width || 1920;
    
    // Generate responsive versions
    for (const size of IMAGE_SIZES) {
      // Skip if size is larger than original
      if (size > originalWidth) {
        console.log(`  ⏭️  Skipping ${size}w (larger than original ${originalWidth}px)`);
        continue;
      }
      
      const outputPath = join(INPUT_DIR, `${name}-${size}w.webp`);
      
      await sharp(filePath)
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: QUALITY })
        .toFile(outputPath);
      
      const stats = await stat(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  ✅ Generated ${name}-${size}w.webp (${sizeMB} MB)`);
    }
    
    // Also create a default WebP version
    const defaultPath = join(INPUT_DIR, `${name}.webp`);
    await sharp(filePath)
      .webp({ quality: QUALITY })
      .toFile(defaultPath);
    
    const defaultStats = await stat(defaultPath);
    const defaultSizeMB = (defaultStats.size / 1024 / 1024).toFixed(2);
    console.log(`  ✅ Generated ${name}.webp (${defaultSizeMB} MB)`);
    
  } catch (error) {
    console.error(`  ❌ Error optimizing ${fileName}:`, error.message);
  }
}

async function processDirectory(dir) {
  console.log(`📁 Processing directory: ${dir}\n`);
  
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(filePath);
      } else {
        await optimizeImage(filePath, file);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${INPUT_DIR}`);
  console.log(`Sizes: ${IMAGE_SIZES.join(', ')}px`);
  console.log(`Quality: ${QUALITY}%\n`);
  
  const startTime = Date.now();
  await processDirectory(INPUT_DIR);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✨ Image optimization completed in ${duration}s`);
  console.log('\n💡 Next steps:');
  console.log('1. Update image references in your code to use WebP versions');
  console.log('2. Consider using <picture> tags with srcset for responsive images');
  console.log('3. Add fallback to original format for browsers without WebP support');
}

main().catch(console.error);
