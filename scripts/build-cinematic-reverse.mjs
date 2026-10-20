import {readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const films=[
  {src:'01-goggles-on.mp4',dst:'01-goggles-on-reverse.mp4',start:0, sha:'9bd9dd8e2b91bcbe3cd81df6b79a17ee817864c044e4cdfeca2d907bbd296a50'},
  {src:'02-dissolve.mp4',dst:'02-dissolve-reverse.mp4',start:1.8,sha:'af22e46683cbf354362f0396a40b2c6ec65f5f46428650c82d7e48e9f9cd3314'},
  {src:'03-shatter.mp4',dst:'03-shatter-reverse.mp4',start:0,sha:'1629989e38a8869e6e1ac80689ffac1cfd2e7aea45e0caa6ee4a5be9a567bba2'}
];
for (const film of films) {
  const input=path.join('public/films',film.src);
  const output=path.join('public/films',film.dst);
  const hash=createHash('sha256').update(await readFile(input)).digest('hex');
  if(hash!==film.sha)throw Error('The original video is not the byte-identical owner upload: '+film.src);
  const options=film.start ? ['-ss',String(film.start)] : [];
  let result;
  for (const crf of [16,18,20]) {
    result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...options,
      '-i',input,'-an','-vf','reverse','-c:v','libx264','-preset','fast','-crf',String(crf),
      '-pix_fmt','yuv420p','-movflags','+faststart',output],
      {encoding:'utf8',timeout:240000,maxBuffer:10000000});
    if (result.status!==0)throw Error('Reverse failed for '+film.src+' '+String(result.error||result.stderr));
    const size=(await stat(output)).size;
    if(size<=24*1024*1024){console.log(film.dst+' reversed 1080p CRF '+crf+' size '+size);break;}
    console.log('Reverse larger than hosting limit; trying higher compression for reversed playback only');
  }
  if((await stat(output)).size>24*1024*1024)throw Error('Reverse video exceeds hosting file limit '+film.dst);
}
console.log('All original files verified and reverse-only clips assembled.');
