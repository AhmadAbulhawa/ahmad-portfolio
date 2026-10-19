"""Reproducible, non-destructive edits. Run from repository root.
Usage: python scripts/edit-media.py /path/to/original-munjiz.mp4
Full-source contact-sheet review informed these scene boundaries.
"""
import json
import subprocess
import sys
from pathlib import Path

source = Path(sys.argv[1]).resolve()
out = Path('public/projects')
out.mkdir(parents=True, exist_ok=True)
# Cut after scenes settle; retain the camera moves between each pair of scenes.
edits = [
    ('munjiz-arrival', 0.80, 3.30, 0.1, 'Tower approach into the presentation studio'),
    ('munjiz-studios', 3.70, 7.20, 0.85, 'Curved facade movement through exam and project studios'),
    ('munjiz-perspective', 7.60, 11.15, 0.90, 'Career studio transition into the work collection'),
]
manifest = []
for name, start, end, poster_time, rationale in edits:
    video = out / f'{name}.mp4'
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', str(start), '-i', str(source), '-t', str(end-start), '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(video)], check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-ss', str(poster_time), '-i', str(video), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '87', str(out / f'{name}.webp')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-f', 'null', '-'], check=True)
    manifest.append(dict(name=name, source_start=start, source_end=end, rationale=rationale, bytes=video.stat().st_size))
Path('docs').mkdir(exist_ok=True)
Path('docs/munjiz-edit-decisions.json').write_text(json.dumps(manifest, indent=2)+'\n')
