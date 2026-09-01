import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: Array<{ id?: string; url: string; isPrimary?: boolean; file?: File }>;
  onChange: (images: Array<{ id?: string; url: string; isPrimary?: boolean; file?: File }>) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      toast.warning(`Seulement ${remainingSlots} image(s) supplémentaire(s) autorisée(s)`);
    }

    const newImages = filesToUpload.map((file, index) => ({
      id: `pending-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      isPrimary: images.length === 0 && index === 0,
    }));

    onChange([...images, ...newImages]);
    toast.success(`${newImages.length} image(s) ajoutée(s), en attente de l'enregistrement`);
  }, [images, maxImages, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || images.length >= maxImages) return;

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith('image/')
    );

    if (files.length === 0) {
      toast.error('Veuillez déposer des fichiers image uniquement');
      return;
    }

    addFiles(files);
  }, [addFiles, disabled, images.length, maxImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (file) => file.type.startsWith('image/')
    );

    if (files.length === 0) {
      toast.error('Veuillez sélectionner des fichiers image uniquement');
      return;
    }

    addFiles(files);
  }, [addFiles]);

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary image, set the first remaining as primary
    if (images[index]?.isPrimary && newImages.length > 0) {
      newImages[0] = { ...newImages[0], isPrimary: true };
    }
    onChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <label className="block font-semibold text-[#1a1a1a] text-xs">
        Images du produit
      </label>

      {/* Dropzone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#008060] bg-[#f0f9f6]'
            : 'border-[#e1e3e5] bg-[#f6f6f7] hover:border-[#008060] hover:bg-[#f0f9f6]'
        } ${disabled || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || images.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-[#6d7175]" />
          <p className="text-xs text-[#6d7175] font-medium">
            {images.length >= maxImages
              ? `Maximum ${maxImages} images atteint`
              : 'Glissez-déposez vos images ici ou cliquez pour sélectionner'}
          </p>
          <p className="text-[10px] text-[#8c9196]">
            JPG, PNG, WebP (max. {maxImages} images)
          </p>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className="relative group rounded-xl overflow-hidden border border-[#e1e3e5] aspect-square"
            >
              <img
                src={image.url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-[#008060] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Principale
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="p-2 bg-white rounded-lg hover:bg-[#f6f6f7] transition-colors"
                    title="Définir comme image principale"
                  >
                    <ImageIcon className="w-4 h-4 text-[#1a1a1a]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  title="Supprimer l'image"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
