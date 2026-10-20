import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const width = 480, height = 270, bytes = width * height * 3;
function decode(file, options = []) {
  const result = spawnSync('ffmpeg', ['-v', 'error', ...options, '-i', file,
    '-vf', `scale=${width}:${height}`, '-fps_mode', 'passthrough', '-f', 'rawvideo',
    '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 100 * 1024 * 1024 });
  if (result.status !== 0) throw Error(result.stderr.toString());
  return Array.from({ length: result.stdout.length / bytes }, (_, i) => result.stdout.subarray(i * bytes, (i + 1) * bytes));
}
function difference(a, b) {
  let sum = 0;
  for (let i = 0; i < bytes; i++) sum += Math.abs(a[i] - b[i]);
  return sum / bytes;
}
const original = decode('public/films/01-goggles-on.mp4');
const corrected = decode('public/films/01-goggles-on-continuous.mp4');
const reversed = decode('public/films/01-goggles-on-continuous-reverse.mp4');
const incoming = decode('public/films/02-dissolve.mp4', ['-ss', '1.5']);
assert.equal(original.length, 77);
assert.equal(corrected.length, original.length, 'No appended bridge or held tail');
assert.equal(reversed.length, corrected.length);
const retainedErrors = original.slice(0, 65).map((frame, i) => difference(frame, corrected[i]));
assert.ok(Math.max(...retainedErrors) < 4, 'Retain original motion until frame 64');
assert.ok(difference(corrected.at(-1), incoming[0]) < 3, 'Resolve to the actual next shot');
assert.ok(difference(reversed[0], incoming[0]) < 3, 'Reverse starts on that same pose');
const steps = corrected.slice(65).map((frame, i) => difference(frame, corrected[64 + i]));
const median = [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)];
assert.ok(Math.max(...steps) < median * 4, 'No single-frame pose jump inside the repaired motion');
assert.ok(Math.min(...steps) > 0.1, 'The repaired movement must not freeze');

// Fit the best possible opacity blend to the center motion frame. A large
// residual confirms that geometry moves; this is not the rejected crossfade.
const a = corrected[64], b = corrected[76], middle = corrected[70];
let numerator = 0, denominator = 0, count = 0;
for (let y = 38; y < 188; y++) for (let x = 125; x < 350; x++) for (let c = 0; c < 3; c++) {
  const i = (y * width + x) * 3 + c, delta = b[i] - a[i];
  numerator += delta * (middle[i] - a[i]); denominator += delta * delta; count++;
}
const alpha = Math.max(0, Math.min(1, numerator / denominator));
let residual = 0;
for (let y = 38; y < 188; y++) for (let x = 125; x < 350; x++) for (let c = 0; c < 3; c++) {
  const i = (y * width + x) * 3 + c;
  residual += Math.abs(middle[i] - (a[i] + alpha * (b[i] - a[i])));
}
const report = { frames: corrected.length, retainedFrames: 65, interpolatedFrames: 11,
  retainedMaxError: Math.max(...retainedErrors), endpointError: difference(corrected.at(-1), incoming[0]),
  reverseEndpointError: difference(reversed[0], incoming[0]), stepDifferences: steps,
  bestCrossfadeWeight: alpha, crossfadeResidual: residual / count };
assert.ok(report.crossfadeResidual > 8, 'Motion must not be a linear opacity blend');
await mkdir('work/continuous-intro', { recursive: true });
await writeFile('work/continuous-intro/motion-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
