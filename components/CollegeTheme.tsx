import { headers } from "next/headers";
import { getInstitutionBySlug } from "@/lib/institution";
import { INST_HEADER } from "@/proxy";

/**
 * Injects the current college's theme class onto <html> so each institution
 * renders with its own accent palette. Reads the slug from the proxy header.
 * Renders nothing visible.
 */
export default async function CollegeTheme() {
  const h = await headers();
  const slug = h.get(INST_HEADER);
  if (!slug) return null;

  let theme: string | null = null;
  try {
    const inst = await getInstitutionBySlug(slug);
    theme = inst?.theme ?? "amber";
  } catch {
    theme = "amber";
  }

  const script = `document.documentElement.setAttribute("data-college","${theme}")`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
