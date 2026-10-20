import { createHash } from 'node:crypto';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// Keep the owner's originals intact. The playback derivative contains every
// original intro frame, then resolves to the exact decoded opening of film 02.
const original = 'public/films/01-goggles-on.mp4';
const next = 'public/films/02-dissolve.mp4';
for (const [file, expected] of [
  [original, '9bd9dd8e2b91bcbe3cd81df6b79a17ee817864c044e4cdfeca2d907bbd296a50'],
  [next, 'af22e46683cbf354362f0396a40b2c6ec65f5f46428650c82d7e48e9f9cd3314'],
]) {
  if (createHash('sha256').update(await readFile(file)).digest('hex') !== expected)
    throw Error(`Unexpected original footage: ${file}`);
}
await mkdir('work/matched-intro', { recursive: true });
function run(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    encoding: 'utf8', timeout: 240000,
  });
  if (result.status !== 0) throw Error(result.stderr || String(result.error));
}
const target = 'work/matched-intro/dissolve-start.png';
run(['-ss', '1.5', '-i', next, '-frames:v', '1', target]);
const forward = 'public/films/01-goggles-on-aligned.mp4';
const reverse = 'public/films/01-goggles-on-aligned-reverse.mp4';
const encoding = ['-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16',
  '-pix_fmt', 'yuv420p', '-r', '24', '-fps_mode', 'cfr', '-movflags', '+faststart'];
// 77 original frames + a nine-frame dissolve + three endpoint holds, at 24 fps.
// Only opacity changes in this short editorial join: no zoom, crop, warp,
// generated texture, optical-flow artifacts, or transform of the source image.
run(['-i', original, '-loop', '1', '-framerate', '24', '-i', target,
  '-filter_complex',
  '[0:v]setpts=N/(24*TB),tpad=stop_mode=clone:stop_duration=0.5,fps=24,settb=AVTB[a];' +
  '[1:v]format=yuv420p,fps=24,settb=AVTB[b];' +
  '[a][b]xfade=transition=fade:duration=0.375:offset=3.208333333,' +
  'trim=end_frame=89,setpts=N/(24*TB),format=yuv420p[v]',
  '-map', '[v]', ...encoding, forward]);
run(['-i', forward, '-vf', 'reverse', ...encoding, reverse]);
for (const file of [forward, reverse]) {
  const bytes = (await stat(file)).size;
  if (bytes > 24 * 1024 * 1024) throw Error(`Hosting limit exceeded: ${file}`);
  console.log(`${file}: ${bytes} bytes`);
}
