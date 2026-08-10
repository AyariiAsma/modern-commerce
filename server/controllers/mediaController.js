import { run, query, queryOne } from '../config/database.js';
import { StorageService } from '../services/storageService.js';

export const uploadMedia = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // Process through Storage Service
        const savedMeta = await StorageService.saveFile(req.file);

        // Store metadata in media table
        const result = await run(
            `INSERT INTO media (filename, file_path, file_url, mime_type, size) VALUES (?, ?, ?, ?, ?)`,
            [savedMeta.filename, savedMeta.filePath, savedMeta.fileUrl, savedMeta.mimeType, savedMeta.size]
        );

        res.status(201).json({
            id: result.lastID,
            filename: savedMeta.filename,
            url: savedMeta.fileUrl,
            mimeType: savedMeta.mimeType,
            size: savedMeta.size
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload media.', error: err.message });
    }
};

export const getMedia = async (req, res) => {
    try {
        const list = await query('SELECT * FROM media ORDER BY created_at DESC');
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve media listings.', error: err.message });
    }
};

export const deleteMedia = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await queryOne('SELECT * FROM media WHERE id = ?', [id]);
        if (!item) {
            return res.status(404).json({ message: 'Media record not found.' });
        }

        // Delete from storage provider
        await StorageService.deleteFile(item.file_path);

        // Delete from database
        await run('DELETE FROM media WHERE id = ?', [id]);

        res.json({ message: 'Media file and metadata deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete media.', error: err.message });
    }
};
