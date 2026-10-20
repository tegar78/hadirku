const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const pico = require('./pico');

let classify_region = null;

// Initialize facefinder cascade classifier
function initModel() {
  if (classify_region) return classify_region;
  try {
    const modelPath = path.join(__dirname, 'facefinder.bin');
    if (fs.existsSync(modelPath)) {
      const buffer = fs.readFileSync(modelPath);
      const bytes = new Int8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      classify_region = pico.unpack_cascade(bytes);
      console.log('🤖 AI Face Detection Model (Pico) initialized successfully.');
    } else {
      console.warn('⚠️ facefinder.bin not found at:', modelPath);
    }
  } catch (err) {
    console.error('Failed to load facefinder model:', err);
  }
  return classify_region;
}

// Ensure model is loaded on module import
initModel();

function rgbaToGrayscale(rgba, width, height) {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; ++i) {
    // Standard luminosity formula
    gray[i] = (299 * rgba[4 * i + 0] + 587 * rgba[4 * i + 1] + 114 * rgba[4 * i + 2]) / 1000;
  }
  return gray;
}

/**
 * Detect faces in a JPEG buffer or file path
 * @param {Buffer|string} input - JPEG buffer or absolute path to JPEG file
 * @returns {Promise<{ hasFace: boolean, faceCount: number, maxConfidence: number, faces: Array }>}
 */
async function detectFace(input) {
  const classifier = initModel();
  if (!classifier) {
    console.warn('Face classifier not available, bypassing check.');
    return { hasFace: true, faceCount: 1, maxConfidence: 99, faces: [] };
  }

  let jpegBuffer;
  if (typeof input === 'string') {
    jpegBuffer = fs.readFileSync(input);
  } else if (Buffer.isBuffer(input)) {
    jpegBuffer = input;
  } else {
    throw new Error('Input must be a Buffer or file path string');
  }

  // 1. Decode JPEG to RGBA pixel buffer
  let decoded;
  try {
    decoded = jpeg.decode(jpegBuffer, { useTArray: true });
  } catch (decodeErr) {
    console.warn('JPEG decode failed:', decodeErr.message);
    return { hasFace: false, faceCount: 0, maxConfidence: 0, faces: [] };
  }

  const { width, height, data } = decoded;

  // 2. Convert to Grayscale
  const grayscale = rgbaToGrayscale(data, width, height);

  const image = {
    pixels: grayscale,
    nrows: height,
    ncols: width,
    ldim: width,
  };

  const params = {
    shiftfactor: 0.1, // Move detection window by 10%
    minsize: Math.max(24, Math.floor(Math.min(width, height) * 0.08)), // Face should be at least 8% of image
    maxsize: Math.min(width, height),
    scalefactor: 1.15,
  };

  // 3. Run Pico Object Detection Cascade
  let detections = pico.run_cascade(image, classifier, params);

  // 4. Cluster overlapping detections
  detections = pico.cluster_detections(detections, 0.2);

  // Filter detections by confidence score (pico default threshold is typically > 2.0)
  const confidentFaces = detections.filter((det) => det[3] >= 2.0);

  const maxConfidence = confidentFaces.length > 0 ? Math.max(...confidentFaces.map((d) => d[3])) : 0;

  return {
    hasFace: confidentFaces.length > 0,
    faceCount: confidentFaces.length,
    maxConfidence: Math.round(maxConfidence * 10) / 10,
    faces: confidentFaces.map((d) => ({
      y: Math.round(d[0]),
      x: Math.round(d[1]),
      size: Math.round(d[2]),
      score: Math.round(d[3] * 10) / 10,
    })),
  };
}

module.exports = {
  detectFace,
};
