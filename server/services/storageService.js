import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DiskStorageProvider {
    constructor() {
        this.uploadDir = path.resolve(__dirname, '../../public/uploads');
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file) {
        // Generate unique name
        const timestamp = Date.now();
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${timestamp}-${cleanName}`;
        const targetPath = path.join(this.uploadDir, filename);

        // Move the file from temp directory to permanent uploads folder
        fs.renameSync(file.path, targetPath);

        const url = `/uploads/${filename}`;
        
        return {
            filename,
            filePath: targetPath,
            fileUrl: url,
            mimeType: file.mimetype,
            size: file.size
        };
    }

    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to delete file from disk:', err);
            return false;
        }
    }
}

// Later, an S3StorageProvider class can be defined here implementing saveFile and deleteFile.
// The active provider is exported as StorageService.
export const StorageService = new DiskStorageProvider();
