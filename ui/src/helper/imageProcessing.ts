export interface ProcessImageOptions {
  maxDimension?: number;
  jpegQuality?: number;
}

export interface ProcessImageResult {
  file: File;
  wasProcessed: boolean;
}

export class ImageProcessingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

function isHeicFile(file: File): boolean {
  const heicMimeTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  if (heicMimeTypes.includes(file.type)) {
    return true;
  }
  return /\.hei[cf]$/i.test(file.name);
}

async function canvasToBlob(
  canvas: Canvas2DSource,
  type: string,
  quality: number
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas conversion to blob failed'));
      } else {
        resolve(blob);
      }
    }, type, quality);
  });
}

type Canvas2DSource = OffscreenCanvas | HTMLCanvasElement;

export async function processImageForUpload(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessImageResult> {
  const maxDimension = options.maxDimension ?? 2048;
  const jpegQuality = options.jpegQuality ?? 0.82;

  try {
    let sourceBlob: Blob = file;
    let originalFileName = file.name;

    // HEIC/HEIF detection and conversion
    if (isHeicFile(file)) {
      try {
        const heic2any = (await import('heic2any')).default;
        const result = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: jpegQuality,
        });
        sourceBlob = Array.isArray(result) ? result[0] : result;
      } catch (err) {
        throw new ImageProcessingError(
          `Could not convert '${file.name}'. It may be corrupted or in an unsupported HEIC variant.`,
          err
        );
      }
    }

    // Check if format is supported
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!isHeicFile(file) && !supportedMimeTypes.includes(file.type)) {
      return { file, wasProcessed: false };
    }

    // Decode with EXIF orientation
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(sourceBlob, { imageOrientation: 'from-image' });
    } catch (err) {
      throw new ImageProcessingError(
        `'${originalFileName}' could not be processed. It may be corrupted.`,
        err
      );
    }

    // Short-circuit: if already small and wasn't HEIC, skip re-encoding
    const maxDim = Math.max(bitmap.width, bitmap.height);
    if (!isHeicFile(file) && maxDim <= maxDimension) {
      bitmap.close();
      return { file, wasProcessed: false };
    }

    // Resize and re-encode
    const scale = Math.min(1, maxDimension / maxDim);
    const outW = Math.round(bitmap.width * scale);
    const outH = Math.round(bitmap.height * scale);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

    const canvas: Canvas2DSource =
      'OffscreenCanvas' in window
        ? new OffscreenCanvas(outW, outH)
        : Object.assign(document.createElement('canvas'), { width: outW, height: outH });

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
      throw new ImageProcessingError('Failed to get canvas context');
    }

    (ctx as any).drawImage(bitmap, 0, 0, outW, outH);
    bitmap.close();

    const blob = await canvasToBlob(canvas, outputType, jpegQuality);

    const newName =
      outputType === 'image/png'
        ? originalFileName.replace(/\.\w+$/, '.png')
        : originalFileName.replace(/\.\w+$/, '.jpg');

    const newFile = new File([blob], newName, { type: outputType, lastModified: Date.now() });
    return { file: newFile, wasProcessed: true };
  } catch (err) {
    if (err instanceof ImageProcessingError) {
      throw err;
    }
    throw new ImageProcessingError(`Could not process '${file.name}'.`, err);
  }
}
