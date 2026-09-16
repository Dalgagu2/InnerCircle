import { File } from 'expo-file-system';

interface ContactImage {
  uri?: string;
  base64?: string;
}

// Contacts photos come back either as a base64 blob directly, or as a local
// file URI that needs to be read and encoded ourselves. Either way we return
// a self-contained data URI so it keeps working after the OS's temp copy of
// the photo is gone, without needing to manage a separate file cache.
export async function resolveContactPhotoUri(image?: ContactImage): Promise<string | undefined> {
  if (!image) return undefined;

  if (image.base64) {
    return `data:image/jpeg;base64,${image.base64}`;
  }

  if (image.uri) {
    try {
      const base64 = await new File(image.uri).base64();
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error reading contact photo:', error);
      return undefined;
    }
  }

  return undefined;
}
