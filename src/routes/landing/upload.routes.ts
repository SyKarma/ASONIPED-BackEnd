import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Store in memory then write to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
});

router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeOriginal = req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${timestamp}-${safeOriginal}`;
    const outPath = path.join(uploadsDir, filename);

    fs.writeFileSync(outPath, req.file.buffer);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${filename}`;
    return res.json({ url });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;


