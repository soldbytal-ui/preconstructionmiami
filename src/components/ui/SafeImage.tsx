'use client';

import { useState } from 'react';

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined;
  /** Shown in place of the picture when it is missing or fails to load. */
  fallbackSrc?: string;
  fallbackLabel?: string;
};

/**
 * Listing photos are hosted on third-party sites and do go missing. This shows
 * a clean placeholder instead of the browser's broken-image icon.
 */
export default function SafeImage({ src, fallbackSrc, fallbackLabel, alt, className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const current = !src || usedFallback ? fallbackSrc : src;

  if (!current || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-surface2 to-surface text-text-muted/40 ${className || ''}`}
      >
        <span className="text-4xl font-light">{(fallbackLabel || alt || '').trim().charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={current}
      alt={alt}
      className={className}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!usedFallback && fallbackSrc && current !== fallbackSrc) setUsedFallback(true);
        else setFailed(true);
      }}
    />
  );
}
