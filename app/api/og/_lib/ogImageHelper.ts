/**
 * Module-level in-memory cache for pre-sized archetype OG assets.
 * Caches base64 data URLs across warm edge/serverless invocations to avoid redundant RTT and CPU cycles.
 */
const ogImageCache = new Map<string, string>();

/**
 * Allowlist of known archetype filenames (without extension).
 * Derived from public/archetypes directory contents.
 * This prevents path traversal attacks by only allowing known archetype slugs.
 */
const KNOWN_ARCHETYPE_SLUGS = [
  'explorer',
  'hodler',
  'wizard',
  'yield-farmer',
  'trader',
  'architect',
  'patron',
  'collector',
  'quiet-wallet',
  'network-pioneer',
] as const;

/**
 * Validates that a path refers to a known archetype asset.
 * Returns the normalized path if valid, undefined if potentially malicious.
 */
function validateArchetypePath(path: string): string | undefined {
  // Must start with /archetypes/
  if (!path.startsWith('/archetypes/')) {
    return undefined;
  }

  // Extract the filename (last part of path)
  const fileName = path.split('/').pop();
  if (!fileName) {
    return undefined;
  }

  // Extract slug (filename without extension)
  const slug = fileName.replace(/\.(png|webp|jpg|jpeg)$/i, '');

  // Check if slug is in the allowlist
  if (!KNOWN_ARCHETYPE_SLUGS.includes(slug as any)) {
    return undefined;
  }

  // Validate the full path structure matches expected patterns
  const validPatterns = [
    /^\/archetypes\/[a-z-]+\.(png|webp)$/i,
    /^\/archetypes\/og\/[a-z-]+\.png$/i,
    /^\/archetypes\/responsive\/\d+\/[a-z-]+\.(png|webp)$/i,
  ];

  if (!validPatterns.some(pattern => pattern.test(path))) {
    return undefined;
  }

  // Additional check: ensure no path traversal sequences
  if (path.includes('..') || path.includes('//') || path.includes('%')) {
    return undefined;
  }

  return path;
}

/**
 * Resolves and fetches a pre-sized archetype image for OG routes.
 * Prefers the pre-sized 200x200 asset (/archetypes/og/${slug}.png) rather than fetching a large source image,
 * falling back to the standard image path if necessary.
 * 
 * Security: Paths are validated against an allowlist to prevent path traversal attacks.
 */
export async function fetchOgArchetypeImage(
  baseUrl: string,
  persona: string,
  explicitPath?: string
): Promise<string | null> {
  const slug = persona
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, "-");

  let preferredPath = `/archetypes/og/${slug}.png`;
  let fallbackPath = `/archetypes/${slug}.png`;

  // If an explicit path is provided, validate it against the allowlist
  if (explicitPath) {
    const validatedPath = validateArchetypePath(explicitPath);
    
    // If validation fails, fall back to persona-derived path (ignore the explicit path)
    if (!validatedPath) {
      // Use only persona-derived paths when explicit path is invalid
      preferredPath = `/archetypes/og/${slug}.png`;
      fallbackPath = `/archetypes/${slug}.png`;
    } else {
      // Use validated explicit path
      if (validatedPath.includes("/og/")) {
        preferredPath = validatedPath;
      } else {
        const fileName = validatedPath.split("/").pop();
        preferredPath = `/archetypes/og/${fileName}`;
        fallbackPath = validatedPath;
      }
    }
  }

  const cached =
    ogImageCache.get(preferredPath) ?? (fallbackPath ? ogImageCache.get(fallbackPath) : undefined);
  if (cached) return cached;

  const candidatePaths =
    preferredPath === fallbackPath ? [preferredPath] : [preferredPath, fallbackPath];

  for (const path of candidatePaths) {
    try {
      // Double-check path is valid before fetching (defense in depth)
      const validatedPath = validateArchetypePath(path);
      if (!validatedPath) {
        continue;
      }

      const imgRes = await fetch(`${baseUrl}${validatedPath}`);
      
      // Ensure we only process successful image responses
      if (imgRes.ok) {
        const contentType = imgRes.headers.get("content-type") || "";
        
        // Only accept image content types
        if (!contentType.startsWith("image/")) {
          continue;
        }

        const buf = await imgRes.arrayBuffer();
        const mime = contentType || "image/png";
        const base64String = btoa(
          new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        const dataUri = `data:${mime};base64,${base64String}`;
        ogImageCache.set(path, dataUri);
        return dataUri;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}
