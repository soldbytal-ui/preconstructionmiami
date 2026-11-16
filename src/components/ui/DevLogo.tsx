'use client';

import { useState } from 'react';

/** Developer logo that falls back to initials when the image is missing or dead. */
export default function DevLogo({
  src, name, imgClassName, initialsClassName,
}: { src?: string | null; name: string; imgClassName: string; initialsClassName: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/[\s,&]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  if (!src || failed) return <span className={initialsClassName}>{initials}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${name} logo`} className={imgClassName} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
