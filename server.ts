import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StoredPhoto {
  id: string;
  dataUrl: string;
  collageType: string;
  templateName: string;
  createdAt: number;
}

// In-memory ephemeral storage for photos taken on the PID kiosk
const photoStorage = new Map<string, StoredPhoto>();

// Periodic cleanup of photos older than 2 hours
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, photo] of photoStorage.entries()) {
    if (photo.createdAt < twoHoursAgo) {
      photoStorage.delete(id);
    }
  }
}, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser with 30MB limit for high-resolution canvas captures
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // API Route: Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: Save final composite photo
  app.post('/api/photos', (req: Request, res: Response) => {
    try {
      const { dataUrl, collageType = 'strip', templateName = 'Standard' } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'dataUrl is required' });
        return;
      }

      // Generate friendly unique ID
      const randomStr = Math.random().toString(36).substring(2, 8);
      const id = `photo_${Date.now().toString(36)}_${randomStr}`;

      photoStorage.set(id, {
        id,
        dataUrl,
        collageType,
        templateName,
        createdAt: Date.now(),
      });

      // Construct URLs
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      // If APP_URL is provided in environment, prefer it for mobile devices
      const baseUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${protocol}://${host}`;

      res.status(201).json({
        success: true,
        id,
        viewUrl: `${baseUrl}/p/${id}`,
        imageUrl: `${baseUrl}/api/photos/${id}`,
        downloadUrl: `${baseUrl}/api/photos/${id}/download`,
      });
    } catch (err) {
      console.error('Failed to save photo:', err);
      res.status(500).json({ error: 'Internal server error while saving photo' });
    }
  });

  // API Route: Save uploaded template PNG permanently to public/templates/
  app.post('/api/upload-template', async (req: Request, res: Response) => {
    try {
      const { dataUrl, filename = 'plesir.png' } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: 'dataUrl is required' });
        return;
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ error: 'Invalid dataUrl format' });
        return;
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const fs = await import('fs');
      const targetDir = path.join(process.cwd(), 'public', 'templates');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, filename);
      fs.writeFileSync(targetPath, buffer);
      // Also write directly as PLESIR.png in public
      fs.writeFileSync(path.join(process.cwd(), 'public', 'PLESIR.png'), buffer);

      res.json({ success: true, path: `/templates/${filename}` });
    } catch (err) {
      console.error('Failed to save uploaded template:', err);
      res.status(500).json({ error: 'Failed to write template file to disk' });
    }
  });

  // API Route: Get photo metadata
  app.get('/api/photos/:id/info', (req: Request, res: Response) => {
    const photo = photoStorage.get(req.params.id);
    if (!photo) {
      res.status(404).json({ error: 'Photo expired or not found' });
      return;
    }
    res.json({
      id: photo.id,
      collageType: photo.collageType,
      templateName: photo.templateName,
      createdAt: photo.createdAt,
    });
  });

  // API Route: View raw photo
  app.get('/api/photos/:id', (req: Request, res: Response) => {
    const photo = photoStorage.get(req.params.id);
    if (!photo) {
      res.status(404).send('Foto tidak ditemukan atau sudah kedaluwarsa.');
      return;
    }

    try {
      const matches = photo.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).send('Format foto tidak valid.');
        return;
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (err) {
      console.error('Error streaming photo:', err);
      res.status(500).send('Gagal memuat gambar');
    }
  });

  // API Route: Direct download photo with attachment header
  app.get('/api/photos/:id/download', (req: Request, res: Response) => {
    const photo = photoStorage.get(req.params.id);
    if (!photo) {
      res.status(404).send('Foto tidak ditemukan atau sudah kedaluwarsa.');
      return;
    }

    try {
      const matches = photo.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).send('Format foto tidak valid.');
        return;
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.includes('png') ? 'png' : 'jpg';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="PID-Photobooth-${photo.id}.${ext}"`);
      res.send(buffer);
    } catch (err) {
      console.error('Error downloading photo:', err);
      res.status(500).send('Gagal mengunduh gambar');
    }
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Photobooth Layar PID server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
