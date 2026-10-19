/* Native srcSet is intentional: all sizes are generated offline for static hosting.
   Next's runtime image optimizer is unavailable in a static export. */
/* eslint-disable @next/next/no-img-element */
type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  sizes?: string;
};
export function Poster({ src, alt, width, height, priority = false, sizes }: Props) {
  const small = width > height ? 720 : 280;
  return (
    <img
      src={src}
      srcSet={`${src.replace('.webp', '-small.webp')} ${small}w, ${src} ${width}w`}
      sizes={
        sizes ??
        (width > height
          ? '(max-width: 760px) calc(100vw - 40px), calc(100vw - 112px)'
          : priority
            ? '(max-width: 560px) 140px, (max-width: 760px) 180px, (max-width: 1100px) 230px, 270px'
            : '(max-width: 560px) 75vw, 340px')
      }
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
