import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('out');
const routes = [
  'index.html',
  '404.html',
  ...['garage-tahmeen', 'munjiz', 'aqar-ai', 'cismate'].map((s) => `projects/${s}/index.html`),
];
for (const route of routes) {
  const html = await readFile(path.join(output, route), 'utf8');
  if (!html.includes('main-content')) throw new Error(`Missing main landmark: ${route}`);
  const resources = [...html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:[?#][^"]*)?"/g)].map(
    (m) => m[1],
  );
  for (const match of html.matchAll(/srcset="([^"]+)"/gi)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/')) resources.push(url);
    }
  }
  for (const url of resources) {
    const local = path.join(output, decodeURIComponent(url));
    try {
      await stat(local);
    } catch {
      throw new Error(`Broken static resource ${url} in ${route}`);
    }
  }
}
async function walk(dir) {
  const result = [];
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, file.name);
    if (file.isDirectory()) result.push(...(await walk(p)));
    else result.push(p);
  }
  return result;
}
const files = await walk(output);
let total = 0;
for (const file of files) {
  const { size } = await stat(file);
  total += size;
  if (size > 25 * 1024 * 1024) throw new Error(`Cloudflare Pages 25 MiB limit exceeded: ${file}`);
}
if (files.length > 20000) throw new Error('Cloudflare Pages free file-count limit exceeded');
const domain = process.env.NEXT_PUBLIC_SITE_URL;
if (domain) {
  const origin = new URL(domain);
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash)
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS origin without a path');
  const urls = [
    '/',
    '/projects/garage-tahmeen/',
    '/projects/munjiz/',
    '/projects/aqar-ai/',
    '/projects/cismate/',
  ];
  await writeFile(
    path.join(output, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>${new URL(p, origin).href}</loc></url>`).join('')}</urlset>`,
  );
}
await writeFile(
  path.join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\n${domain ? `Sitemap: ${new URL('/sitemap.xml', domain).href}\n` : ''}`,
);
console.log(
  `Static export verified: ${routes.length} pages, ${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MiB. All assets below 25 MiB.`,
);
if (!domain)
  console.log(
    'Final domain not selected: canonical URLs and sitemap intentionally omitted. Set NEXT_PUBLIC_SITE_URL for the approved domain.',
  );
