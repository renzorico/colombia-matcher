/**
 * photos.ts — Local candidate photo paths.
 *
 * Photos are served from /public/candidates/ by Vercel.
 * Using a frontend-side map makes photo display independent of the backend
 * API's image_url field, which may lag behind redeployments.
 */

export const CANDIDATE_PHOTOS: Readonly<Record<string, string>> = {
  "ivan-cepeda":              "/candidates/ivan-cepeda.jpg",
  "abelardo-de-la-espriella": "/candidates/abelardo-de-la-espriella.jpg",
  "sergio-fajardo":           "/candidates/sergio-fajardo.jpg",
  "paloma-valencia":          "/candidates/paloma-valencia.jpg",
  "roy-barreras":             "/candidates/roy-barreras.jpg",
  "claudia-lopez":            "/candidates/claudia-lopez.jpg",
};

/** Returns the local photo path for a candidate, or null if not available. */
export function candidatePhoto(id: string): string | null {
  return CANDIDATE_PHOTOS[id] ?? null;
}
