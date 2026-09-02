import React, { useRef, useState } from 'react';
import { uploadImagesToCloudinary, validateImageFile } from '@/lib/cloudinary';

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, max = 6 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');

    const files = Array.from(fileList).slice(0, Math.max(0, max - images.length));
    for (const f of files) {
      const err = validateImageFile(f);
      if (err) { setError(err); return; }
    }
    if (files.length === 0) return;

    setUploading(true);
    try {
      const results = await uploadImagesToCloudinary(files);
      onChange([...images, ...results.map((r) => r.url)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (url: string) => onChange(images.filter((u) => u !== url));

  return (
    <div>
      <label className="block text-sm font-medium text-[#3D4852] mb-2">Event Photos</label>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((url) => (
          <div key={url} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)]">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
            >
              ×
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-2xl bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] flex items-center justify-center text-[#6C63FF] text-3xl disabled:opacity-50"
          >
            {uploading ? '…' : '+'}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-1 text-xs text-[#6B7280]">Up to {max} images, 5MB each — hosted free on Cloudinary.</p>
    </div>
  );
};

export default ImageUploader;