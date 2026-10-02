import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const WAIT = {
  boot: 120,
  in: 1300,
  scatter: 1100,
  stack: 1300,
  open: 1200,
  title: 900,
};

function nameParts(name) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  const first = tokens[0] || 'Hadi';
  const last = tokens.slice(1).join(' ');
  const line = (last ? `${first} ${last}` : first).toUpperCase();
  return {
    first: first.toUpperCase(),
    line,
    keepFirst: 0,
    keepLast: last ? first.length + 1 : -1,
  };
}

export default function IntroHero({ name, videoSrc, onReady }) {
  const parts = nameParts(name || 'Hadi Mogharbel');
  const letters = [...parts.line];
  const [stage, setStage] = useState('boot');
  const [shift, setShift] = useState(null);
  const firstRef = useRef(null);
  const lastRef = useRef(null);
  const videoRef = useRef(null);
  const readySent = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStage('done');
      return undefined;
    }

    const sequence = ['in', 'scatter', 'stack', 'open', 'title', 'done'];
    let elapsed = 0;
    const timers = sequence.map((next) => {
      const previous = next === 'in' ? 'boot' : sequence[sequence.indexOf(next) - 1];
      elapsed += WAIT[previous];
      return setTimeout(() => setStage(next), elapsed);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    document.body.style.overflow = stage === 'done' ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'done' && !readySent.current) {
      readySent.current = true;
      onReady?.();
    }
  }, [stage, onReady]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !videoSrc) return undefined;
    if (stage === 'open' || stage === 'title' || stage === 'done') {
      node.play().catch(() => {});
    }
    return undefined;
  }, [stage, videoSrc]);

  useLayoutEffect(() => {
    if (stage !== 'stack' || shift || parts.keepLast < 0) return;
    const first = firstRef.current?.getBoundingClientRect();
    const last = lastRef.current?.getBoundingClientRect();
    if (!first || !last) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const gap = 8;
    const firstTargetTop = cy - first.height - gap / 2;
    const lastTargetTop = cy + gap / 2;

    setShift({
      first: {
        x: cx - (first.left + first.width / 2),
        y: firstTargetTop - first.top,
      },
      last: {
        x: cx - (last.left + last.width / 2),
        y: lastTargetTop - last.top,
      },
    });
  }, [stage, shift, parts.keepLast]);

  function skip() {
    setStage('done');
  }

  const midpoint = letters.length / 2;

  return (
    <section className="intro" id="top" data-stage={stage}>
      <div className="intro-media">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="intro-video"
            src={videoSrc}
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : null}
      </div>

      <div className="intro-letters" aria-hidden="true">
        {letters.map((char, index) => {
          const keep = index === parts.keepFirst || index === parts.keepLast;
          const motion = keep && shift
            ? shift[index === parts.keepFirst ? 'first' : 'last']
            : null;
          return (
            <span
              key={`${char}-${index}`}
              ref={index === parts.keepFirst ? firstRef : index === parts.keepLast ? lastRef : undefined}
              className={char === ' ' ? 'letter space' : keep ? 'letter keep' : 'letter'}
              style={{
                '--fly': index < midpoint ? '-16vw' : '16vw',
                transitionDelay: stage === 'boot' || stage === 'in' ? `${index * 28}ms` : '0ms',
                transform: motion ? `translate(${motion.x}px, ${motion.y}px)` : undefined,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>

      <h1 className="intro-word">{parts.first}</h1>

      {stage !== 'done' ? (
        <button className="intro-skip" type="button" onClick={skip}>Skip</button>
      ) : null}
    </section>
  );
}
