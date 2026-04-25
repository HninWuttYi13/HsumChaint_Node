import multer from 'multer';
import { AppError } from '@/utils/AppError';

//store file in memory as buffer for direct upload to R2
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, //2MB file size limit
  },
  //validation function to accept or reject file
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    //allowedMIME Types that sent from the browser
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    //get file extension from original name and convert to lower case for comparison
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    //MIME type can be faked and also check extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    //if the MIME type  valid or extension is valid, accept file
    if (
      allowedMimeTypes.includes(file.mimetype) ||
      (fileExtension && allowedExtensions.includes(fileExtension))
    ) {
      cb(null, true);
    } else {
      cb(new AppError('Only image are allowed', 400));
    }
  },
});
