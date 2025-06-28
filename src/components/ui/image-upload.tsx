'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './button';
import { Input } from './input';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  label = "Image",
  bucket = "product-images",
  folder = "products"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // For self-hosted Supabase, try to create bucket if it doesn't exist
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError);
        // If listBuckets fails, it might be a self-hosted setup issue
        // Try to proceed with upload anyway
        console.log('Proceeding with upload despite bucket check failure...');
      } else {
        const bucketExists = buckets?.some(b => b.id === bucket);
        if (!bucketExists) {
          console.log(`Bucket '${bucket}' not found. Attempting to create it...`);
          
          // Try to create bucket programmatically for self-hosted
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            console.error('Failed to create bucket:', createError);
            throw new Error(`Storage bucket '${bucket}' does not exist and could not be created automatically. Please run the self-hosted storage setup SQL.`);
          } else {
            console.log(`Bucket '${bucket}' created successfully.`);
          }
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        if (error.message.includes('new row violates row-level security')) {
          throw new Error('Upload permission denied. Please run the self-hosted storage setup SQL to create proper policies.');
        }
        if (error.message.includes('relation "storage.objects" does not exist')) {
          throw new Error('Storage tables not found. Please run the self-hosted storage setup SQL.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Upload successful, public URL:', publicUrl);
      onChange(publicUrl);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      const errorMessage = error.message || 'File upload failed. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      handleFileUpload(file);
    }
  };

  const removeImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              uploadMode === 'url' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              uploadMode === 'file' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload
          </button>
        </div>
      </div>

      {uploadMode === 'url' ? (
        <Input
          placeholder="Enter image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-dashed border-gray-300 hover:border-gray-400"
          >
            {isUploading ? 'Uploading...' : 'Choose Image File'}
          </Button>
          <p className="text-xs text-gray-500">
            Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
          </p>
        </div>
      )}

      {value && (
        <div className="space-y-2">
          <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              onError={() => {
                console.error('Image failed to load:', value);
              }}
            />
          </div>
          <Button
            type="button"
            onClick={removeImage}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          >
            Remove Image
          </Button>
        </div>
      )}
    </div>
  );
}