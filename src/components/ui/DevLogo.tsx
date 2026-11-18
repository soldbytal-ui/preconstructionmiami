'use client';

import { useState } from 'react';

/**
 * Developer mark. `src` holds one logo tile, or several comma-separated tiles
 * for a joint venture; each tile is a square image with its own background.
 * Falls back to initials when there is no logo or an image fails to load.
 */
export default function DevLogo({
  src, name, size = 56, initialsClassName = 'text-accent-green font-semibold text-lg',
}: { src?: string | null; name: string; size?: number; initialsClassName?: string }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const urls = (src || '').split(',').map((u) => u.trim()).filter((u) => u && !failed[u]).slice(0, 3);
  const radius = Math.round(size * 0.22);

  if (!urls.length) {
    const initials = name.split(/[\s,&/]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-accent-green/20 to-accent-blue/20"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <span className={initialsClassName}>{initials}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center" role="img" aria-label={`${name} logo`}>
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={u}
          src={u}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((f) => ({ ...f, [u]: true }))}
          className="border border-white/10 object-cover"
          style={{ width: size, height: size, borderRadius: radius, marginLeft: i ? 6 : 0 }}
        />
      ))}
    </div>
  );
}
