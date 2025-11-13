// Utility to normalize HTML content for display in detail pages
// Specifically removes <p> wrappers and empty paragraphs while preserving line breaks.

/**
 * Remove paragraph tags from HTML while keeping content and line breaks.
 * - Converts paragraph boundaries to <br/> when appropriate
 * - Removes empty paragraphs like <p></p>, <p><br/></p>, <p>&nbsp;</p>
 * - Leaves other inline/formatting tags intact (b, i, u, a, strong, em, span, etc.)
 * @param {string} html
 * @returns {string}
 */
export function removePTags(html) {
  if (html === null || html === undefined) return '';
  let s = String(html);

  // Normalize different forms of <br> to a consistent <br/>
  s = s.replace(/<br\s*\/?\s*>/gi, '<br/>');

  // Remove empty paragraphs
  s = s.replace(/<p[^>]*>(\s|&nbsp;|<br\/>)*<\/p>/gi, '');

  // Replace paragraph boundaries with a single <br/>
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, '<br/>' );

  // Unwrap remaining opening/closing p tags
  s = s.replace(/<p[^>]*>/gi, '');
  s = s.replace(/<\/p>/gi, '');

  // Trim extra breaks/whitespace at the ends
  s = s.replace(/^(<br\/>\s*)+/, '');
  s = s.replace(/(\s*<br\/>)+\s*$/, '');
  return s.trim();
}

/**
 * Remove all HTML tags, leaving only plain text. Useful when rich HTML is not desired.
 * @param {string} html
 * @returns {string}
 */
export function stripAllTags(html) {
  if (html === null || html === undefined) return '';
  return String(html).replace(/<[^>]*>?/gm, '').trim();
}
