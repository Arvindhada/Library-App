// ─────────────────────────────────────────────────────────────
// Cloudinary Free Photo Upload
// Account: https://cloudinary.com (Free — 25GB storage)
// ─────────────────────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME = 'dqxvkmniz';         // ✅ Tera cloud name
const CLOUDINARY_UPLOAD_PRESET = 'library_photos';  // ✅ Preset name

// ─────────────────────────────────────────────────────────────
// Upload a single photo to Cloudinary
// @param {string} localUri  — local file URI from ImagePicker
// @param {string} folder    — folder name in Cloudinary (e.g. 'libraries')
// @returns {string}         — permanent Cloudinary URL
// ─────────────────────────────────────────────────────────────
export const uploadToCloudinary = async (localUri, folder = 'libraries') => {
  const formData = new FormData();

  // Get file extension
  const ext = localUri.split('.').pop() || 'jpg';
  const fileName = `photo_${Date.now()}.${ext}`;

  formData.append('file', {
    uri: localUri,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    name: fileName,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url; // permanent HTTPS URL
};

// ─────────────────────────────────────────────────────────────
// Upload multiple photos (returns array of URLs)
// ─────────────────────────────────────────────────────────────
export const uploadMultiplePhotos = async (localUris, folder = 'libraries', onProgress) => {
  const urls = [];
  for (let i = 0; i < localUris.length; i++) {
    const uri = localUris[i];
    if (uri.startsWith('http')) {
      // Already a cloud URL — skip
      urls.push(uri);
    } else {
      // Local URI — upload
      if (onProgress) onProgress(i + 1, localUris.length);
      const url = await uploadToCloudinary(uri, folder);
      urls.push(url);
    }
  }
  return urls;
};
