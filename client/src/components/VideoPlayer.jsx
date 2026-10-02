import { getVideoSource } from '../video.js';

export default function VideoPlayer({ post }) {
  const source = getVideoSource(post);

  if (!source) {
    return <p className="empty">No video attached yet.</p>;
  }

  if (source.type === 'embed') {
    return (
      <div className="video-frame">
        <iframe
          src={source.src}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video className="video-file" controls preload="metadata" src={source.src}>
      Your browser can&apos;t play this video.
    </video>
  );
}
