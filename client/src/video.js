export function getVideoSource(post) {
  if (post.videoFileUrl) {
    return { type: 'file', src: post.videoFileUrl };
  }

  const url = (post.videoUrl || '').trim();
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtube) {
    return { type: 'embed', src: `https://www.youtube.com/embed/${youtube[1]}` };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { type: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  return { type: 'file', src: url };
}
