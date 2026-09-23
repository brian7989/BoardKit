// Shown in place of a picsum.photos/album-art image when the network can't reach it (an
// offline demo, a locked-down sandbox) instead of a broken-image icon.
export const IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#cbd5e1"/><path d="M40 140l40-50 30 35 25-30 25 45z" fill="#94a3b8"/><circle cx="70" cy="70" r="14" fill="#94a3b8"/></svg>',
  );
