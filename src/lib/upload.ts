export async function uploadImageToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const rawFolder = import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined;

  if (!cloudName || !uploadPreset) {
    throw new Error('Image upload is not configured. Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  // Optional folder; sanitize Windows backslashes → forward slashes
  if (rawFolder && rawFolder.trim()) {
    const folder = rawFolder.replace(/\\/g, '/');
    formData.append('folder', folder);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const secureUrl = data.secure_url || data.url;
  if (!secureUrl) {
    throw new Error('Upload succeeded but no URL was returned');
  }
  return secureUrl as string;
} 