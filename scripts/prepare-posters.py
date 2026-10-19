"""Create actual responsive delivery files; never change original aspect ratios."""
import subprocess
from pathlib import Path
for source in Path('public/projects').glob('*.webp'):
    if source.stem.endswith(('-small','-thumb')):
        continue
    # CIS screenshots are already small, lossless in layout; use exact half-size thumbs.
    if source.stem in ('cismate-planner','cismate-schedule'):
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-vf','scale=iw/2:ih/2','-c:v','libwebp','-quality','82',str(source.with_stem(source.stem+'-thumb'))],check=True)
    if source.stem.startswith('cismate-'):
        continue
    width = 720 if source.stem.startswith(('aqar-','garage-')) else 280
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-vf',f'scale={width}:-1','-c:v','libwebp','-quality','82',str(source.with_stem(source.stem+'-small'))],check=True)
