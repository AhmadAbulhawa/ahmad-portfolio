# Cloudflare Pages — static deployment, only after approval

Nothing has been deployed or published. Do not connect or deploy this project until the owner approves. Git-connected Pages can automatically publish production or preview deployments; keep automatic deployments disabled until then.

## Local verification

Node.js 22 or newer (verified on Node 24), npm, no backend or paid services.

```sh
npm ci
npm run lint
npm run typecheck
npm run build
python -m http.server 3000 --directory out
```

`out/` is the complete static website. There are no server actions, API routes, SSR, runtime database connections, or Next image-optimization server. `next start` is not used for a static export. All project routes have generated HTML, including direct navigation and refresh.

## After approval: Pages settings

- Framework preset: None (static Next.js export).
- Build command: `npm run build`.
- Build output directory: `out`.
- Root directory: repository root.
- Set build environment `NODE_VERSION=22` (or a supported newer LTS).
- Set `NEXT_PUBLIC_SITE_URL` to the approved HTTPS origin, without any path, query, or fragment. This creates canonical metadata, absolute social image URLs, robots.txt, and sitemap.xml at build time. Never use a temporary guessed domain as a canonical URL.
- Do NOT use the Next.js full-stack preset, next-on-pages, Workers, server bindings, or a paid backend.
- Production branch: select only after the pull request and missing media are reviewed. Do not enable preview deployments earlier than approval.

Alternatively, after approval and the final domain build, upload `out/` using Pages Direct Upload. The generated directory alone is sufficient.

`public/_headers` is copied into the export. It sets conservative browser security headers and caches hashed Next assets. Video sources are loaded only after user interaction. Each media file is well below Cloudflare Pages' 25 MiB per-asset limit; `scripts/check-export.mjs` also rejects oversized files, excessive file counts, and missing internal static resources.

## Pre-publication review

See `docs/CONTENT-AND-MEDIA.md`: The three owner-selected Garage scenes are integrated without further trimming; the clipped header and identity-bearing copy/location have been masked for client privacy. Integrate the actual latest CV and downloadable screenshot files when supplied. Confirm links, final domain, mobile playback, and that the approved build contains only authorized clips. Canonical metadata and social previews should be checked against the final domain after setting the environment variable and rebuilding.
