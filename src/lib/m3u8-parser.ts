import type { M3U8Entry, ChannelCategory, ChannelStream } from "@/types/xtream";

/**
 * Parse M3U8/M3U playlist content into entries
 */
export function parseM3U8Content(content: string): M3U8Entry[] {
  const entries: M3U8Entry[] = [];
  const lines = content.split(/\r?\n/);

  let currentEntry: Partial<M3U8Entry> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments (except #EXTINF)
    if (!line || (line.startsWith("#") && !line.startsWith("#EXTINF"))) {
      continue;
    }

    // Parse EXTINF line
    if (line.startsWith("#EXTINF:")) {
      currentEntry = parseExtInfLine(line);
      continue;
    }

    // If line is a URL, create an entry
    if (isValidUrl(line)) {
      if (currentEntry) {
        entries.push({
          url: line,
          name: currentEntry.name || extractNameFromUrl(line),
          logo: currentEntry.logo,
          groupTitle: currentEntry.groupTitle,
          tvgId: currentEntry.tvgId,
          tvgName: currentEntry.tvgName,
          duration: currentEntry.duration,
        });
        currentEntry = null;
      } else {
        // URL without EXTINF
        entries.push({
          url: line,
          name: extractNameFromUrl(line),
        });
      }
    }
  }

  return entries;
}

/**
 * Parse #EXTINF line attributes
 */
function parseExtInfLine(line: string): Partial<M3U8Entry> {
  const entry: Partial<M3U8Entry> = {};

  // Extract duration (first number after #EXTINF:)
  const durationMatch = line.match(/#EXTINF:(-?\d+)/);
  if (durationMatch) {
    entry.duration = parseInt(durationMatch[1], 10);
  }

  // Extract tvg-id
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
  if (tvgIdMatch) {
    entry.tvgId = tvgIdMatch[1];
  }

  // Extract tvg-name
  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
  if (tvgNameMatch) {
    entry.tvgName = tvgNameMatch[1];
  }

  // Extract tvg-logo
  const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
  if (logoMatch) {
    entry.logo = logoMatch[1];
  }

  // Extract group-title
  const groupMatch = line.match(/group-title="([^"]*)"/i);
  if (groupMatch) {
    entry.groupTitle = groupMatch[1];
  }

  // Extract channel name (last part after comma)
  const commaIndex = line.lastIndexOf(",");
  if (commaIndex !== -1) {
    const name = line.substring(commaIndex + 1).trim();
    if (name) {
      entry.name = name;
    }
  }

  // Use tvg-name as fallback for name
  if (!entry.name && entry.tvgName) {
    entry.name = entry.tvgName;
  }

  return entry;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  if (!str) return false;

  // Check for common protocols
  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("rtmp://") ||
    str.startsWith("rtsp://") ||
    str.startsWith("mms://")
  ) {
    return true;
  }

  return false;
}

/**
 * Extract a name from a URL
 */
function extractNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Remove extension
      return lastPart.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
    }
    return parsed.hostname;
  } catch {
    return "Unknown Channel";
  }
}

/**
 * Convert M3U8 entries to ChannelCategory format
 */
export function m3u8ToCategories(entries: M3U8Entry[], defaultGroupName = "General"): ChannelCategory[] {
  // Group entries by group-title
  const groupedEntries = new Map<string, M3U8Entry[]>();

  entries.forEach((entry) => {
    const groupName = entry.groupTitle || defaultGroupName;
    if (!groupedEntries.has(groupName)) {
      groupedEntries.set(groupName, []);
    }
    groupedEntries.get(groupName)!.push(entry);
  });

  // Convert to ChannelCategory format
  const categories: ChannelCategory[] = [];
  let categoryOrder = 0;
  let streamIdCounter = 1;

  groupedEntries.forEach((groupEntries, groupName) => {
    const streams: ChannelStream[] = groupEntries.map((entry) => ({
      id: streamIdCounter++,
      name: entry.name,
      streamType: detectStreamType(entry.url),
      streamIcon: entry.logo || null,
      streamUrl: entry.url,
      groupTitle: entry.groupTitle,
    }));

    categories.push({
      id: generateCategoryId(groupName),
      name: groupName,
      order: categoryOrder++,
      parentId: "0",
      streams,
    });
  });

  return categories;
}

/**
 * Detect stream type from URL
 */
function detectStreamType(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes(".m3u8") || lowerUrl.includes("/live/")) {
    return "live";
  }
  if (lowerUrl.includes(".mp4") || lowerUrl.includes("/movie/") || lowerUrl.includes("/vod/")) {
    return "movie";
  }
  if (lowerUrl.includes("/series/")) {
    return "series";
  }

  // Default to live for most IPTV streams
  return "live";
}

/**
 * Generate a consistent category ID from name
 */
function generateCategoryId(name: string): string {
  return `m3u8_${name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_")}`;
}

/**
 * Fetch and parse M3U8 from URL
 */
export async function fetchAndParseM3U8(
  url: string,
  options?: {
    userAgent?: string;
    referer?: string;
  }
): Promise<M3U8Entry[]> {
  // Use our proxy to fetch the M3U8 to handle CORS
  const proxyUrl = `/api/proxy/stream?url=${encodeURIComponent(url)}${
    options?.referer ? `&referer=${encodeURIComponent(options.referer)}` : ""
  }`;

  const response = await fetch(proxyUrl, {
    headers: {
      Accept: "text/plain, application/x-mpegurl, application/vnd.apple.mpegurl, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch M3U8: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  return parseM3U8Content(content);
}

/**
 * Validate M3U8 content
 */
export function isValidM3U8Content(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith("#EXTM3U") ||
    trimmed.startsWith("#EXTINF") ||
    // Some playlists don't have the header
    (trimmed.includes("#EXTINF:") && trimmed.includes("http"))
  );
}
