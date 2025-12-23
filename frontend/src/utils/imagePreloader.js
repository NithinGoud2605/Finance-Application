/**
 * Utility functions for preloading images to improve user experience
 */

/**
 * Preload a single image
 * 
 * @param {string} src - Image source URL
 * @returns {Promise} - Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Preload an array of images
 * 
 * @param {string[]} sources - Array of image source URLs
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export const preloadImages = (sources) => {
  return Promise.all(sources.map(src => preloadImage(src)));
};

/**
 * Preload images with a callback for progress updates
 * 
 * @param {string[]} sources - Array of image source URLs
 * @param {Function} progressCallback - Callback function that receives progress updates (0-100)
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export const preloadImagesWithProgress = (sources, progressCallback) => {
  let loaded = 0;
  const total = sources.length;
  
  return Promise.all(
    sources.map(src => 
      preloadImage(src)
        .then(img => {
          loaded++;
          if (progressCallback) {
            progressCallback(Math.round((loaded / total) * 100), img);
          }
          return img;
        })
    )
  );
};

/**
 * Prepare critical images for immediate loading
 * 
 * @param {string[]} criticalImages - Array of critical image source URLs
 * @param {string[]} nonCriticalImages - Array of non-critical image source URLs
 * @returns {Promise} - Promise that resolves when critical images are loaded
 */
export const prepareImages = (criticalImages = [], nonCriticalImages = []) => {
  // First load critical images
  return preloadImages(criticalImages)
    .then(() => {
      // Then start loading non-critical images
      if (nonCriticalImages.length > 0) {
        // Use requestIdleCallback if available for less important images
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            preloadImages(nonCriticalImages);
          });
        } else {
          // Fallback to setTimeout
          setTimeout(() => {
            preloadImages(nonCriticalImages);
          }, 1000);
        }
      }
    });
};

export default {
  preloadImage,
  preloadImages,
  preloadImagesWithProgress,
  prepareImages
}; 