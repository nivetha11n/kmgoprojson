#!/usr/bin/env node

const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require('gopro-telemetry');
const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: node processTelemetry.js <input_video_path>');
  process.exit(1);
}

const videoFilePath = process.argv[2];

console.log('Input video file path:', videoFilePath);

// Create a readable stream from the video file
const readStream = fs.createReadStream(videoFilePath);

// Collect chunks of data from the stream
const chunks = [];
readStream.on('data', (chunk) => {
  chunks.push(chunk);
});

readStream.on('end', () => {
  // Concatenate the chunks to create the complete video data
  const videoData = Buffer.concat(chunks);
  
  gpmfExtract(videoData)
  .then((gpmfData) => {
    return goproTelemetry(gpmfData, { simple: true });
  })
    .then((telemetryData) => {
      // Convert BigInt values to strings
      const sanitizedTelemetryData = JSON.parse(JSON.stringify(telemetryData, (key, value) =>
        typeof value === 'bigint'
          ? value.toString()
          : value
      ));
      console.log(JSON.stringify(sanitizedTelemetryData, null, 2));
    })
    .catch((err) => {
      console.error('Error processing GPMF data:', err);
    });
});

readStream.on('error', (error) => {
  console.error('Error reading the file:', error);
});