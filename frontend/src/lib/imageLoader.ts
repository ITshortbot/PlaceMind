// Used only when NEXT_IMAGES_UNOPTIMIZED=1 (path-prefix dev tunnels).
// Returns the public file URL under the app base path, no optimizer round trip.
export default function imageLoader({ src }: { src: string; width: number; quality?: number }): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${src}`;
}
