"""Optimize the owner's three selected scenes WITHOUT further temporal trimming.
Run from the repository root: python scripts/prepare-garage.py /path/to/archive.zip
The archive and extracted originals are preserved, outside public/. Header-mask
coordinates are specific to the inspected upload; do not apply to other footage.
"""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

def moving_privacy_commands(original, target):
    """Track the known section boundary, not text, to mask client copy and location.
    No words, logos, or source images are copied into public delivery or Git.
    """
    width, height = 1912, 824
    frames = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', str(original)]))['frames']
    timestamps = [float(frame['best_effort_timestamp_time']) for frame in frames]
    process = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(original), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-fps_mode', 'passthrough', '-'], stdout=subprocess.PIPE)
    commands = []
    index = 0
    while True:
        frame = process.stdout.read(width * height * 3)
        if not frame:
            break
        if len(frame) != width * height * 3:
            raise ValueError('Incomplete decoded source frame')
        edge = height
        if index >= 175:
            for y in range(24, height - 8):
                matches = 0
                for offset in range(8):
                    pos = ((y + offset) * width + 80) * 3
                    r, g, b = frame[pos:pos + 3]
                    matches += int(r < 110 and g - r > 8 and b - g > 3 and b - r > 14)
                if matches == 8:
                    edge = 0 if y <= 30 else y
                    break
        copy_y = (0 if edge == 0 else edge + 50) if edge < height else 900
        address_y = edge - 112
        color_y = min(height - 1, max(40, edge + 80))
        pos = (color_y * width + 100) * 3
        color = ''.join(f'{value:02x}' for value in frame[pos:pos + 3])
        # Commands use the actual 1/30017 source time base, never assumed 30 fps.
        timestamp = max(0, timestamps[index] - 0.00001)
        # Keep a wider privacy envelope while the paragraph crosses the top
        # boundary; narrow only after the identifying line has left the frame.
        copy_height = 140 if timestamps[index] < 8.18 else 110
        commands.append(f'{timestamp:.9f} drawbox@clientcopy h {copy_height}, drawbox@clientcopy y {copy_y}, drawbox@clientcopy color 0x{color}, drawbox@clientaddress y {address_y};')
        index += 1
    if process.wait() != 0:
        raise RuntimeError('Source decoding failed')
    target.write_text('\n'.join(commands) + '\n')
    return index

archive = Path(sys.argv[1]).resolve()
before = hashlib.sha256(archive.read_bytes()).hexdigest()
originals = Path('work/garage-originals')
originals.mkdir(parents=True, exist_ok=True)
out = Path('public/projects')
scenes = [('rotation', 1.65), ('scan', 4.50), ('drive', 1.20)]
decisions = []
with zipfile.ZipFile(archive) as bundle:
    members = sorted(m for m in bundle.namelist() if m.lower().endswith('.mp4'))
    if len(members) != 3:
        raise ValueError('This reviewed edit requires exactly three owner-selected MP4 files')
    for index, ((scene, poster_time), member) in enumerate(zip(scenes, members), 1):
        original = originals / f'segment-{index}.mp4'
        original.write_bytes(bundle.read(member))
        stream = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(original)]))['streams'][0]
        if (stream['width'], stream['height']) != (1912, 824):
            raise ValueError('Unexpected footage dimensions; revise privacy coordinates before export')
        original_hash = hashlib.sha256(original.read_bytes()).hexdigest()
        stem = f'garage-tahmeen-{scene}'
        destination = out / f'{stem}.mp4'
        filters = 'drawbox=x=0:y=0:w=iw:h=22:color=0x101210:t=fill'
        if index == 1:
            commands = originals / 'privacy.commands'
            moving_privacy_commands(original, commands)
            filters = f'sendcmd=f={commands},' + filters + ',drawbox@clientcopy=x=160:y=900:w=760:h=110:color=0x304a54:t=fill,drawbox@clientaddress=x=1650:y=712:w=250:h=90:color=0x101210:t=fill'
        # Remove only the captured browser scrollbar; keep the complete frame dimensions.
        filters += ',drawbox=x=1901:y=0:w=11:h=ih:color=0x101210:t=fill,scale=1434:618'
        # No -ss or -t: keep all source frames and original scene timing.
        # 1434:618 equals 1912:824 exactly. Mask the clipped header logo fragment.
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(original), '-an', '-map_metadata', '-1', '-vf', filters, '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(destination)], check=True)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(poster_time), '-i', str(destination), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', str(out / f'{stem}.webp')], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(destination), '-f', 'null', '-'], check=True)
        assert hashlib.sha256(original.read_bytes()).hexdigest() == original_hash
        decisions.append(dict(scene=scene, source_segment=index, editing='owner-selected clip; no additional temporal trimming', header_mask_pixels=22, moving_copy_and_location_redacted=(index == 1), privacy_timing='source-frame PTS', browser_scrollbar_masked=True, delivery_width=1434, delivery_height=618, source_sha256=original_hash))
assert hashlib.sha256(archive.read_bytes()).hexdigest() == before
Path('docs/garage-edit-decisions.json').write_text(json.dumps(decisions, indent=2)+'\n')
print('Three complete owner-selected scenes optimized. Original archive and extracted files preserved.')
