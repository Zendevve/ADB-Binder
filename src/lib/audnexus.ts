/**
 * Audnexus API Service
 * Free, community-maintained API for audiobook metadata
 * Docs: https://audnex.us/
 *
 * Provides richer data than scraping Audible directly:
 * - Title, Author, Narrator
 * - Series info with position
 * - High-res cover images
 * - Chapter markers
 * - Genres/Tags
 * - Runtime, Rating, Publisher
 */

export interface AudnexusAuthor {
  asin: string;
  name: string;
}

export interface AudnexusNarrator {
  name: string;
}

export interface AudnexusGenre {
  asin: string;
  name: string;
  type: 'genre' | 'tag';
}

export interface AudnexusSeries {
  asin: string;
  name: string;
  position: string; // Can be "1" or "1-3" for omnibus
}

export interface AudnexusChapter {
  lengthMs: number;
  startOffsetMs: number;
  startOffsetSec: number;
  title: string;
}

export interface AudnexusBook {
  asin: string;
  title: string;
  subtitle?: string;
  authors: AudnexusAuthor[];
  narrators: AudnexusNarrator[];
  publisherName?: string;
  copyright?: number;
  description?: string;
  summary?: string; // HTML formatted
  formatType?: string; // 'unabridged' | 'abridged'
  genres?: AudnexusGenre[];
  image?: string; // High-res cover URL
  isbn?: string;
  language?: string;
  literatureType?: string;
  rating?: string;
  region?: string;
  releaseDate?: string;
  runtimeLengthMin?: number;
  seriesPrimary?: AudnexusSeries;
  seriesSecondary?: AudnexusSeries;
  isAdult?: boolean;
}

export interface AudnexusChaptersResponse {
  asin: string;
  brandIntroDurationMs: number;
  brandOutroDurationMs: number;
  chapters: AudnexusChapter[];
  isAccurate: boolean;
  runtimeLengthMs: number;
  runtimeLengthSec: number;
}

const AUDNEXUS_API = 'https://api.audnex.us';

/**
 * Get book details by ASIN
 * @param asin - Audible ASIN (e.g., B08G9PRS1K)
 * @param region - Audible region (us, uk, de, ca, fr, au, in, it, jp, es)
 * @param seedAuthors - Whether to include full author details
 */
export async function getBookByAsin(
  asin: string,
  region: string = 'us',
  seedAuthors: boolean = true
): Promise<AudnexusBook | null> {
  try {
    const params = new URLSearchParams({
      region,
      seedAuthors: seedAuthors.toString(),
    });

    const response = await fetch(`${AUDNEXUS_API}/books/${asin}?${params}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Audnexus: Book not found for ASIN ${asin}`);
        return null;
      }
      throw new Error(`Audnexus API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Audnexus getBookByAsin error:', error);
    return null;
  }
}

/**
 * Get chapter information by ASIN
 * Useful for importing chapter markers into audiobooks
 */
export async function getChaptersByAsin(
  asin: string,
  region: string = 'us'
): Promise<AudnexusChaptersResponse | null> {
  try {
    const params = new URLSearchParams({ region });
    const response = await fetch(`${AUDNEXUS_API}/books/${asin}/chapters?${params}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Audnexus chapters API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Audnexus getChaptersByAsin error:', error);
    return null;
  }
}

/**
 * Search for authors by name
 */
export async function searchAuthorByName(
  name: string,
  region: string = 'us'
): Promise<AudnexusAuthor[] | null> {
  try {
    const params = new URLSearchParams({
      name,
      region,
    });

    const response = await fetch(`${AUDNEXUS_API}/authors?${params}`);

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Audnexus searchAuthorByName error:', error);
    return null;
  }
}

/**
 * Fetch cover image and convert to base64
 */
async function fetchCoverAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags from summary text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Parse series position (handles "1", "1.5", "1-3", etc.)
 */
function parseSeriesPosition(position: string): number | undefined {
  const match = position.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Convert Audnexus book data to our BookMetadata format
 */
export async function audnexusToBookMetadata(book: AudnexusBook): Promise<{
  title: string;
  subtitle?: string;
  author: string;
  narrator?: string;
  year?: string;
  description?: string;
  publisher?: string;
  genre?: string;
  language?: string;
  isbn?: string;
  asin: string;
  series?: string;
  seriesNumber?: number;
  tags?: string[];
  coverData?: string;
}> {
  // Fetch cover image
  let coverData: string | undefined;
  if (book.image) {
    coverData = await fetchCoverAsBase64(book.image) ?? undefined;
  }

  // Extract genre and tags
  const genreItem = book.genres?.find(g => g.type === 'genre');
  const tagItems = book.genres?.filter(g => g.type === 'tag').map(g => g.name) || [];

  // Get series info
  const series = book.seriesPrimary || book.seriesSecondary;

  return {
    title: book.title,
    subtitle: book.subtitle,
    author: book.authors.map(a => a.name).join(', '),
    narrator: book.narrators?.map(n => n.name).join(', '),
    year: book.copyright?.toString() || (book.releaseDate ? new Date(book.releaseDate).getFullYear().toString() : undefined),
    description: book.description || (book.summary ? stripHtml(book.summary) : undefined),
    publisher: book.publisherName,
    genre: genreItem?.name || 'Audiobook',
    language: book.language,
    isbn: book.isbn,
    asin: book.asin,
    series: series?.name,
    seriesNumber: series?.position ? parseSeriesPosition(series.position) : undefined,
    tags: tagItems,
    coverData,
  };
}

/**
 * Main entry point: Get book metadata by ASIN
 * Returns formatted metadata ready for use
 */
export async function getAudnexusMetadata(
  asin: string,
  region: string = 'us'
): Promise<ReturnType<typeof audnexusToBookMetadata> | null> {
  const book = await getBookByAsin(asin, region);
  if (!book) return null;
  return audnexusToBookMetadata(book);
}
