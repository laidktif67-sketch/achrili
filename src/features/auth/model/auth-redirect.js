const ALLOWED_NEXT_PAGES = new Set(['profile.html', 'request.html']);

export function safeNextPage(value) {
  return ALLOWED_NEXT_PAGES.has(value) ? value : null;
}
