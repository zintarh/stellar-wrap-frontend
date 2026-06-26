/**
 * JsonLd - Renders a JSON-LD structured data script tag.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", ... }} />
 *
 * This is a Server Component (no "use client" directive) so it can be used
 * in layouts and server-rendered pages for SSR-friendly structured data.
 */

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Next.js / React 19 supports suppressHydrationWarning on script tags
      // dangerouslySetInnerHTML is the canonical pattern for JSON-LD in React
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
