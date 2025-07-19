#!/usr/bin/env node
/*
 * Simple extractor for DJI MP4 files with embedded GPMF (metadata) blocks.
 * Usage:  node scripts/extract-dji-gpmf.js <input.mp4> [output.json]
 * Requires ffprobe to be available in PATH.
 *
 * The script runs ffprobe with JSON output and scans frames for side_data_list
 * items that contain the key 'gpmf' (DJI embeds GPMF in SEI user data).
 * If found, it parses GPS (LAT, LON, ALT) and orientation (YAW, PITCH, ROLL)
 * from the ASCII payload.  The exact parsing covers the common DJI template
 * but may need to be adapted for other models.
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

function usage () {
  console.log('Usage: node scripts/extract-dji-gpmf.js <input.mp4> [output.json]')
  process.exit(1)
}

if (process.argv.length < 3) usage()

const input = resolve(process.argv[2])
const output = process.argv[3] ? resolve(process.argv[3]) : resolve('public/telemetry', basename(input).replace(/\.[^.]+$/, '.json'))

const ff = spawnSync('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_frames', '-select_streams', 'v', input], {
  encoding: 'utf-8',
  maxBuffer: 1024 * 1024 * 100 // 100 MB
})

if (ff.error) {
  console.error('Could not run ffprobe:', ff.error.message)
  process.exit(1)
}

let json
try {
  json = JSON.parse(ff.stdout)
} catch (e) {
  console.error('Failed to parse ffprobe output')
  process.exit(1)
}

const frames = json.frames || []
const telemetry = []

for (const fr of frames) {
  const t = parseFloat(fr.pts_time)
  if (!fr.side_data_list) continue
  for (const sd of fr.side_data_list) {
    if (sd.side_data_type !== 'User Data Unregistered' || !sd.data) continue
    const payload = Buffer.from(sd.data, 'base64').toString('ascii')
    const latMatch = /LAT=(-?\d+\.\d+)/.exec(payload)
    const lonMatch = /LON=(-?\d+\.\d+)/.exec(payload)
    const altMatch = /ALT=(-?\d+\.\d+)/.exec(payload)
    const yawMatch = /YAW=(-?\d+\.\d+)/.exec(payload)
    const pitMatch = /PIT(?:CH)?=(-?\d+\.\d+)/.exec(payload)
    const rolMatch = /ROL(?:L)?=(-?\d+\.\d+)/.exec(payload)
    const spdMatch = /SPD=(-?\d+\.\d+)/.exec(payload)
    if (latMatch && lonMatch) {
      telemetry.push({
        t,
        lat: Number(latMatch[1]),
        lon: Number(lonMatch[1]),
        alt: altMatch ? Number(altMatch[1]) : null,
        yaw: yawMatch ? Number(yawMatch[1]) : null,
        pitch: pitMatch ? Number(pitMatch[1]) : null,
        roll: rolMatch ? Number(rolMatch[1]) : null,
        v: spdMatch ? Number(spdMatch[1]) : null
      })
    }
  }
}

if (!telemetry.length) {
  console.error('No GPMF telemetry found in video. Output file not created.')
  process.exit(2)
}

writeFileSync(output, JSON.stringify(telemetry))
console.log(`Extracted ${telemetry.length} telemetry points -> ${output}`)
