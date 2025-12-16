/**
 * Open Library API service for fetching book metadata
 * Free API, no key required
 * Docs: https://openlibrary.org/developers/api
 */

export interface BookSearchResult {
  key: string; // Open Library work ID
  title: string;
  subtitle?: string;
  author: string;
  publishYear?: number;
  coverId?: number;
  description?: string;
  isbn?: string[];
  subjects?: string[];
  publisher?: string[];
}

export interface BookDetails {
  title: string;
  subtitle?: string;
  description?: string;
  subjects?: string[];
  covers?: number[];
}

const OPEN_LIBRARY_API = 'https://openlibrary.org';
const COVER_API = 'https://covers.openlibrary.org';

/**
 * Search for books by title
 */
export async function searchBooks(query: string, limit = 5): Promise<BookSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      fields: 'key,title,subtitle,author_name,first_publish_year,cover_i,isbn,subject,publisher',
    });

    const response = await fetch(`${OPEN_LIBRARY_API}/search.json?${params}`);

    if (!response.ok) {
      throw new Error(`Open Library search failed: ${response.status}`);
    }

    const data = await response.json();

    return (data.docs || []).map((doc: any) => ({
      key: doc.key,
      title: doc.title || '',
      subtitle: doc.subtitle,
      author: doc.author_name?.[0] || '',
      publishYear: doc.first_publish_year,
      coverId: doc.cover_i,
      isbn: doc.isbn,
      subjects: doc.subject?.slice(0, 10),
      publisher: doc.publisher,
    }));
  } catch (error) {
    console.error('Open Library search error:', error);
    return [];
  }
}

/**
 * Get detailed book info by work ID
 */
export async function getBookDetails(workKey: string): Promise<BookDetails | null> {
  try {
    // workKey format: /works/OL123W
    const cleanKey = workKey.startsWith('/') ? workKey : `/works/${workKey}`;
    const response = await fetch(`${OPEN_LIBRARY_API}${cleanKey}.json`);

    if (!response.ok) return null;

    const data = await response.json();

    // Description can be string or { value: string }
    let description = '';
    if (typeof data.description === 'string') {
      description = data.description;
    } else if (data.description?.value) {
      description = data.description.value;
    }

    return {
      title: data.title,
      subtitle: data.subtitle,
      description,
      subjects: data.subjects?.slice(0, 10),
      covers: data.covers,
    };
  } catch (error) {
    console.error('Open Library details error:', error);
    return null;
  }
}

/**
 * Fetch cover image and convert to base64
 */
export async function fetchCoverImage(coverId: number, size: 'S' | 'M' | 'L' = 'L'): Promise<string | null> {
  try {
    const url = `${COVER_API}/b/id/${coverId}-${size}.jpg`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Cover fetch error:', error);
    return null;
  }
}

/**
 * Search and get full book data in one call
 * This is the main function for the "Auto-fill" feature
 */
export async function autoFillBookMetadata(query: string): Promise<{
  title: string;
  subtitle?: string;
  author: string;
  year?: string;
  description?: string;
  tags?: string[];
  publisher?: string;
  isbn?: string;
  coverData?: string;
} | null> {
  // First search
  const results = await searchBooks(query, 3);

  if (results.length === 0) return null;

  const bestMatch = results[0];

  // Get detailed info if we have a work key
  let description = '';
  if (bestMatch.key) {
    const details = await getBookDetails(bestMatch.key);
    if (details?.description) {
      description = details.description;
    }
  }

  // Fetch cover image
  let coverData: string | undefined;
  if (bestMatch.coverId) {
    const cover = await fetchCoverImage(bestMatch.coverId);
    if (cover) {
      coverData = cover;
    }
  }

  return {
    title: bestMatch.title,
    subtitle: bestMatch.subtitle,
    author: bestMatch.author,
    year: bestMatch.publishYear?.toString(),
    description,
    tags: bestMatch.subjects?.slice(0, 5),
    publisher: bestMatch.publisher?.[0],
    isbn: bestMatch.isbn?.[0],
    coverData,
  };
}
