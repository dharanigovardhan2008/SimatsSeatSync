const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
};

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const MAX_SIZE_MB = 5;

/**
 * Validates a file before upload. Returns an error message string if invalid,
 * or null if the file is good to upload.
 */
export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file (PNG, JPG, WEBP, etc).';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `"${file.name}" is too large. Please use a file under ${MAX_SIZE_MB}MB.`;
  }
  return null;
};

/**
 * Uploads a single image file to Cloudinary using an unsigned upload preset.
 * Returns the secure (https) URL that can be stored directly on the event document.
 */
export const uploadImageToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.'
    );
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET as string);

  // Use XHR instead of fetch so we can report upload progress for the progress bar.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height
          });
        } else {
          reject(new Error(data?.error?.message || 'Image upload failed'));
        }
      } catch {
        reject(new Error('Image upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading image.'));
    xhr.send(formData);
  });
};

/**
 * Uploads multiple image files to Cloudinary in parallel.
 * Returns the results in the same order as the input files.
 */
export const uploadImagesToCloudinary = async (
  files: File[],
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult[]> => {
  const progressPerFile = new Array(files.length).fill(0);

  const updateOverall = () => {
    if (!onProgress) return;
    const total = progressPerFile.reduce((sum, p) => sum + p, 0);
    onProgress(Math.round(total / files.length));
  };

  return Promise.all(
    files.map((file, i) =>
      uploadImageToCloudinary(file, (p) => {
        progressPerFile[i] = p;
        updateOverall();
      })
    )
  );
};