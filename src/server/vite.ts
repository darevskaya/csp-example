import fs from 'node:fs';
import path from 'node:path';
import type { Express, NextFunction, Request, Response } from 'express';
import { isDev } from '../env';

const VITE_PORT = 5173;
const VITE_ORIGIN = `http://localhost:${VITE_PORT}`;
const MANIFEST_PATH = path.join(__dirname, '..', '..', 'public', 'dist', '.vite', 'manifest.json');

type ManifestEntry = { file: string; css?: string[] };
type Manifest = Record<string, ManifestEntry>;

let manifest: Manifest | null = null;

function loadManifest(): Manifest {
  if (!manifest) {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
  }
  return manifest;
}

export function assetUrl(entry: string): string {
  if (isDev) return `${VITE_ORIGIN}/${entry}`;
  const m = loadManifest();
  const found = m[entry];
  if (!found) throw new Error(`Vite manifest: entry not found: ${entry}`);
  return `/dist/${found.file}`;
}

export function cssUrls(entry: string): string[] {
  if (isDev) return [];
  const m = loadManifest();
  const found = m[entry];
  return (found?.css ?? []).map((f) => `/dist/${f}`);
}

export function viteDevMiddleware(app: Express): void {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const url = req.url ?? '/';
    if (!url.startsWith('/@') && !url.startsWith('/src/') && !url.startsWith('/node_modules/')) {
      return next();
    }
    try {
      const proxyRes = await fetch(`${VITE_ORIGIN}${url}`);
      const contentType = proxyRes.headers.get('content-type') ?? 'text/plain';
      res.setHeader('Content-Type', contentType);
      res.status(proxyRes.status);
      const buffer = Buffer.from(await proxyRes.arrayBuffer());
      res.send(buffer);
    } catch {
      next();
    }
  });
}

export const viteHmrScript = isDev
  ? `<script type="module" src="${VITE_ORIGIN}/@vite/client"></script>`
  : '';
