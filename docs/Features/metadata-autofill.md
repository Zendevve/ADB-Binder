# Metadata Auto-Fill Integration

## Overview

The Audiobook Toolkit supports automatic metadata fetching from multiple sources to reduce manual data entry. When a user clicks "Auto-Fill", the system attempts to fetch book information from increasingly general sources.

## Data Sources (Priority Order)

### 1. Audnexus API (Primary)
**When used**: If the ASIN field already contains a value.
**Endpoint**: `https://api.audnex.us/books/{asin}`
**Data provided**:
- Title, Subtitle
- Author(s), Narrator(s)
- Series name and position
- Publisher, Release date
- Description, Genres
- Cover art (high quality)
- Chapter markers

### 2. Audible Scraper (Secondary)
**When used**: If no ASIN is present, searches by title.
**Method**: Scrapes Audible's public search results and detail pages.
**Data provided**:
- Title, Author, Narrator
- Series information
- Cover art
- ASIN (extracted from URL)

### 3. Open Library (Tertiary)
**When used**: Fallback when audiobook-specific sources fail.
**Endpoint**: `https://openlibrary.org/search.json`
**Data provided**:
- Title, Author
- Publisher, Year
- ISBN, Subjects
- Cover art

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/audnexus.ts` | Audnexus API service |
| `src/lib/audible.ts` | Audible scraper |
| `src/lib/open-library.ts` | Open Library API |
| `src/components/wizard/MetadataStep.tsx` | UI integration |

## Usage

1. Go to **Binder** → **Metadata & Cover** step
2. Enter a title (or ASIN in the Advanced section)
3. Click **"Auto-fill from database"**
4. Metadata fields will be populated automatically

## API Notes

- **Audnexus** requires no authentication
- **Audible** scraping may be rate-limited
- **Open Library** is fully open/free
