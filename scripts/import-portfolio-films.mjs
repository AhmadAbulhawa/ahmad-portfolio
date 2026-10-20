import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

const source = await readFile('lib/film-sources.ts','utf8');
const urls = [...source.matchAll(/"src":\s*"(https:\/\/[^"]+)"/g)].map(m => m[1]);
const names=['01-goggles-on.mp4','02-dissolve.mp4','03-shatter.mp4'];
const expected=[
 '9bd9dd8e2b91bcbe3cd81df6b79a17ee817864c044e4cdfeca2d907bbd296a50',
 'af22e46683cbf354362f0396a40b2c6ec65f5f46428650c82d7e48e9f9cd3314',
 '1629989e38a8869e6e1ac80689ffac1cfd2e7aea45e0caa6ee4a5be9a567bba2',
];
if (urls.length !== 3) {
  if (source.includes('/films/01-goggles-on.mp4')) {
    console.log('Original media already committed; nothing to import.');
    process.exit(0);
  }
  throw Error('Expected exactly three remote source URLs');
}
await mkdir('public/films',{recursive:true});
for(let i=0;i<3;i++){
 const file=path.join('public/films',names[i]);
 const response=await fetch(urls[i]);
 if(!response.ok) throw Error('Original film fetch failed: '+names[i]+' status '+response.status);
 const buffer=Buffer.from(await response.arrayBuffer());
 const hash=createHash('sha256').update(buffer).digest('hex');
 if(hash!==expected[i]) throw Error('Original bytes differ from owner upload: '+names[i]+' got '+hash);
 if(buffer.byteLength>25*1024*1024)throw Error('Cloudflare single file limit exceeded: '+names[i]);
 if(buffer.toString('ascii',4,8)!=='ftyp')throw Error('Unexpected media format');
 await writeFile(file,buffer);
 console.log(names[i]+': original file byte-for-byte verified, '+(await stat(file)).size+' bytes');
 const output=path.join('public/films',names[i].replace('.mp4','-poster.jpg'));
 const second=i===1?'2.12':'0';
 const ffmpeg=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',second,'-i',file,'-frames:v','1','-q:v','3',output],{encoding:'utf8'});
 if(ffmpeg.status!==0)throw Error('Poster frame extraction failed for '+names[i]+': '+ffmpeg.stderr);
}
const sources=names.map((name,i)=>({role:['intro','dissolve','shatter'][i],src:'/films/'+name}));
await writeFile('lib/film-sources.ts',
  '/** Byte-identical, self-hosted original 1920×1080 MP4 footage. */\nexport const filmSources = '+
  JSON.stringify(sources,null,2)+' as const;\n');
const posters=names.map(n=>'/films/'+n.replace('.mp4','-poster.jpg'));
await writeFile('lib/film-posters.ts',
  '/** Loading keyframes extracted from the owner-supplied originals. */\nexport const filmPosters = '+
  JSON.stringify(posters,null,2)+' as const;\n');
console.log('All original 1080p videos now self-hosted with permanent local URLs.');
