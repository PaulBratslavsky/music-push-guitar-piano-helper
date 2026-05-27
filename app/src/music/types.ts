// Music feature data model — saved on the client in localStorage. Both
// types carry their own `id` (generated client-side via crypto.randomUUID)
// so they're stable across renames and recoverable on import/export.

export type SavedVideo = {
  id: string;
  /** The pasted URL the user provided. Kept verbatim for re-share / export. */
  url: string;
  /** Parsed out of the URL up-front so we never need to re-parse on load. */
  youtubeVideoId: string;
  title: string;
  author: string;
  /** YouTube thumbnail. Either the noembed-returned URL or the
   *  convention `i.ytimg.com/vi/<id>/hqdefault.jpg` fallback. */
  thumbnailUrl: string;
  /** ISO timestamp. Useful for sorting by recency. */
  createdAt: string;
};

export type SavedLoop = {
  id: string;
  /** Foreign-key to SavedVideo.id. */
  videoId: string;
  /** User-supplied label — required at save time. */
  label: string;
  startSec: number;
  endSec: number;
  createdAt: string;
};
