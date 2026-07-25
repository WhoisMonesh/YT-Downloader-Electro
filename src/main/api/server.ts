import express from 'express';
import cors from 'cors';
import { DownloadEngine } from '../downloader/download-engine';

export function startApiServer(port: number = 3001, downloadEngine: DownloadEngine) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Universal Media Downloader API Server is running' });
  });

  app.get('/api/downloads', (req, res) => {
    try {
      const downloads = downloadEngine.getAllDownloads();
      res.json(downloads);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/download', async (req, res) => {
    try {
      const options = req.body;
      const item = await downloadEngine.startDownload(options);
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.listen(port, () => {
    console.log(`[API Server] Running on http://localhost:${port}`);
  });
}
