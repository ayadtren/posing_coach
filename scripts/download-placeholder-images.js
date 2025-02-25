/**
 * Script to download placeholder images for legendary bodybuilders
 * This is a development utility to create placeholder images for testing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Ensure the legends directory exists
const legendsDir = path.join(__dirname, '../public/images/legends');
if (!fs.existsSync(legendsDir)) {
  fs.mkdirSync(legendsDir, { recursive: true });
  console.log('Created legends directory');
}

// List of placeholder images to download
// Using placehold.co for development purposes
const images = [
  { name: 'arnold-front-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Arnold+Schwarzenegger' },
  { name: 'coleman-front-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Ronnie+Coleman' },
  { name: 'heath-front-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Phil+Heath' },
  { name: 'zane-front-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Frank+Zane' },
  { name: 'haney-front-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Lee+Haney' },
  { name: 'wheeler-front-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Flex+Wheeler' },
  { name: 'columbu-side-chest.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Franco+Columbu' },
  { name: 'yates-side-chest.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Dorian+Yates' },
  { name: 'cutler-side-chest.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Jay+Cutler' },
  { name: 'haney-back-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Lee+Haney+Back' },
  { name: 'yates-back-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Dorian+Yates+Back' },
  { name: 'coleman-back-double-biceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Ronnie+Coleman+Back' },
  { name: 'zane-side-triceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Frank+Zane+Triceps' },
  { name: 'levrone-side-triceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Kevin+Levrone' },
  { name: 'wheeler-side-triceps.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Flex+Wheeler+Triceps' },
  { name: 'ray-back-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Shawn+Ray' },
  { name: 'haney-back-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Lee+Haney+Relaxed' },
  { name: 'heath-back-relaxed.jpg', url: 'https://placehold.co/400x600/1a1a1a/ffffff?text=Phil+Heath+Back' },
];

// Download function
const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(legendsDir, filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`File ${filename} already exists, skipping`);
      resolve();
      return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there's an error
      console.error(`Error downloading ${filename}: ${err.message}`);
      reject(err);
    });
  });
};

// Download all images
const downloadAll = async () => {
  console.log('Starting download of placeholder images...');
  
  for (const image of images) {
    try {
      await downloadImage(image.url, image.name);
    } catch (error) {
      console.error(`Failed to download ${image.name}`);
    }
  }
  
  console.log('All downloads completed');
};

// Run the download
downloadAll(); 