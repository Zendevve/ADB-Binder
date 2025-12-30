/**
 * Audible Metadata Service
 * Fetches audiobook metadata from Audible's public pages.
 * No API key required - uses public search and product pages.
 */

export interface AudibleSearchResult {
  asin: string;
  title: string;
  subtitle?: string;
  author: string;
  narrator?: string;
  coverUrl?: string;
  series?: string;
  seriesNumber?: number;
  runtime?: string;
}

export interface AudibleBookDetails {
  asin: string;
  title: string;
  subtitle?: string;
  author: string;
  narrator?: string;
  publisher?: string;
  releaseDate?: string;
  runtime?: string;
  language?: string;
  series?: string;
  seriesNumber?: number;
  description?: string;
  coverUrl?: string;
  coverData?: string; // base64
  tags?: string[];
}

const AUDIBLE_SEARCH_URL = 'https://www.audible.com/search';
const AUDIBLE_PRODUCT_URL = 'https://www.audible.com/pd';

/**
 * Fetch and convert image URL to base64
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
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
 * Parse HTML response to extract JSON-LD structured data
 * Audible embeds rich product data in JSON-LD format
 */
function extractJsonLd(html: string): any | null {
  try {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!match) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Search Audible for audiobooks
 * Note: This uses the public search page, results may be limited
 */
export async function searchAudible(query: string, limit = 5): Promise<AudibleSearchResult[]> {
  if (!query.trim()) return [];

  try {
    // Use the Audible API-like endpoint (publicly accessible)
    const params = new URLSearchParams({
      keywords: query,
      // These params help get cleaner results
      sort: 'relevance',
    });

    const response = await fetch(`${AUDIBLE_SEARCH_URL}?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      console.warn(`Audible search returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results: AudibleSearchResult[] = [];

    // Parse product cards from search results
    // Look for product containers with data attributes
    const productRegex = /data-asin="([^"]+)"[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?(?:authorLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>)?[\s\S]*?(?:narratorLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>)?/g;

    let match;
    while ((match = productRegex.exec(html)) !== null && results.length < limit) {
      const [, asin, title, author, narrator] = match;

      // Extract cover URL
      const coverMatch = html.match(new RegExp(`data-asin="${asin}"[\\s\\S]*?<img[^>]*src="([^"]+)"`));

      results.push({
        asin: asin.trim(),
        title: title.trim(),
        author: author?.trim() || '',
        narrator: narrator?.trim(),
        coverUrl: coverMatch?.[1]?.replace(/\._[^.]+\./, '._SL500_.'), // Get higher res
      });
    }

    return results;
  } catch (error) {
    console.error('Audible search error:', error);
    return [];
  }
}

/**
 * Get detailed audiobook info by ASIN
 */
export async function getAudibleDetails(asin: string): Promise<AudibleBookDetails | null> {
  try {
    const response = await fetch(`${AUDIBLE_PRODUCT_URL}/${asin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try JSON-LD first (most reliable)
    const jsonLd = extractJsonLd(html);

    if (jsonLd && jsonLd['@type'] === 'Audiobook') {
      const book: AudibleBookDetails = {
        asin,
        title: jsonLd.name || '',
        author: jsonLd.author?.name || (Array.isArray(jsonLd.author) ? jsonLd.author[0]?.name : ''),
        narrator: jsonLd.readBy?.name || (Array.isArray(jsonLd.readBy) ? jsonLd.readBy[0]?.name : ''),
        publisher: jsonLd.publisher?.name,
        description: jsonLd.description,
        runtime: jsonLd.duration,
        coverUrl: jsonLd.image,
      };

      // Fetch cover as base64
      if (book.coverUrl) {
        const coverData = await fetchImageAsBase64(book.coverUrl.replace(/\._[^.]+\./, '._SL500_.'));
        if (coverData) {
          book.coverData = coverData;
        }
      }

      return book;
    }

    // Fallback: Parse HTML directly
    const titleMatch = html.match(/<h1[^>]*class="[^"]*bc-heading[^"]*"[^>]*>([^<]+)<\/h1>/);
    const authorMatch = html.match(/authorLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const narratorMatch = html.match(/narratorLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const publisherMatch = html.match(/publisherLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const seriesMatch = html.match(/seriesLabel[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const descMatch = html.match(/<div[^>]*class="[^"]*productPublisherSummary[^"]*"[^>]*>([\s\S]*?)<\/div>/);

    const book: AudibleBookDetails = {
      asin,
      title: titleMatch?.[1]?.trim() || '',
      author: authorMatch?.[1]?.trim() || '',
      narrator: narratorMatch?.[1]?.trim(),
      publisher: publisherMatch?.[1]?.trim(),
      series: seriesMatch?.[1]?.trim(),
      description: descMatch?.[1]?.replace(/<[^>]+>/g, '').trim(),
    };

    // Parse series number if series exists
    if (book.series) {
      const numberMatch = html.match(/seriesLabel[\s\S]*?,\s*Book\s*(\d+)/i);
      if (numberMatch) {
        book.seriesNumber = parseInt(numberMatch[1], 10);
      }
    }

    return book;
  } catch (error) {
    console.error('Audible details error:', error);
    return null;
  }
}

/**
 * Combined auto-fill function - searches and returns best match with full details
 */
export async function autoFillFromAudible(query: string): Promise<AudibleBookDetails | null> {
  const results = await searchAudible(query, 3);

  if (results.length === 0) return null;

  // Get full details for best match
  return getAudibleDetails(results[0].asin);
}
