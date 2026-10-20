import { createHash } from 'node:crypto';
import { readFile, mkdir, stat, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Complete the final hand movement within the original 77-frame timeline,
// resolving to film 02's decoded opening pose through motion interpolation.
const original = 'public/films/01-goggles-on.mp4';
const next = 'public/films/02-dissolve.mp4';
for (const [file, expected] of [
  [original, '9bd9dd8e2b91bcbe3cd81df6b79a17ee817864c044e4cdfeca2d907bbd296a50'],
  [next, 'af22e46683cbf354362f0396a40b2c6ec65f5f46428650c82d7e48e9f9cd3314'],
]) {
  if (createHash('sha256').update(await readFile(file)).digest('hex') !== expected)
    throw Error(`Unexpected original footage: ${file}`);
}
const rife = process.env.RIFE_BIN;
if (!rife) throw Error('Set RIFE_BIN to the RIFE ncnn Vulkan executable (release 20221029).');
const model = process.env.RIFE_MODEL || path.join(path.dirname(rife), 'rife-v4.6');
const directory = 'work/continuous-intro';
await mkdir(directory, { recursive: true });
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 240000 });
  if (result.status !== 0) throw Error(result.stderr || String(result.error));
}
const ffmpeg = args => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const frame = index => path.join(directory, `frame-${String(index).padStart(3, '0')}.png`);
ffmpeg(['-i', original, '-frames:v', '65', '-fps_mode', 'passthrough', path.join(directory, 'frame-%03d.png')]);
const target = path.join(directory, 'dissolve-start.png');
ffmpeg(['-ss', '1.5', '-i', next, '-frames:v', '1', target]);
for (let step = 1; step < 12; step++) {
  const u = step / 12;
  const time = u * u * (3 - 2 * u);
  run(rife, ['-0', frame(65), '-1', target, '-o', frame(65 + step),
    '-m', model, '-g', '-1', '-j', '1:3:1', '-s', String(time)]);
  console.log(`Motion frame ${step}/11 complete`);
}
await copyFile(target, frame(77));
const forward = 'public/films/01-goggles-on-continuous.mp4';
const reverse = 'public/films/01-goggles-on-continuous-reverse.mp4';
const encoding = ['-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16',
  '-pix_fmt', 'yuv420p', '-r', '24', '-fps_mode', 'cfr', '-movflags', '+faststart'];
ffmpeg(['-framerate', '24', '-start_number', '1', '-i', path.join(directory, 'frame-%03d.png'),
  '-frames:v', '77', ...encoding, forward]);
ffmpeg(['-i', forward, '-vf', 'reverse', ...encoding, reverse]);
for (const file of [forward, reverse]) {
  const bytes = (await stat(file)).size;
  if (bytes > 24 * 1024 * 1024) throw Error(`Hosting limit exceeded: ${file}`);
  console.log(`${file}: ${bytes} bytes`);
}
