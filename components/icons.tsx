import type { SVGProps } from 'react';
export function Arrow({
  diagonal = false,
  ...props
}: SVGProps<SVGSVGElement> & { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      {diagonal ? <path d="M5 19 19 5M5 5h14v14" /> : <path d="M4 12h16m-7-7 7 7-7 7" />}
    </svg>
  );
}
export function Play() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="m6 3 11 7-11 7V3Z" />
    </svg>
  );
}
export function Asterisk() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="9" aria-hidden="true">
      <path d="M40 3v74M3 40h74M14 14l52 52M14 66l52-52" />
    </svg>
  );
}
