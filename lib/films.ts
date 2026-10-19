export type FilmClip = {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  description: string;
  badge: string;
  duration: string;
  title: string;
  note: string;
};
export const munjizClips: FilmClip[] = [
  {
    src: '/projects/munjiz-arrival.mp4',
    poster: '/projects/munjiz-arrival.webp',
    width: 464,
    height: 848,
    label: 'Munjiz — Arrival',
    badge: 'Play scene',
    duration: '00:02.5',
    title: 'An entrance with presence.',
    note: 'The tower gives way to the presentation studio in one uninterrupted approach.',
    description:
      'A selected moment from the original Munjiz brand recording: the tower approach transitions into the presentation studio. Brand presentation, not a platform feature walkthrough.',
  },
  {
    src: '/projects/munjiz-studios.mp4',
    poster: '/projects/munjiz-studios.webp',
    width: 464,
    height: 848,
    label: 'Munjiz — Through the studios',
    badge: 'Play scene',
    duration: '00:03.5',
    title: 'A change in perspective.',
    note: 'A curved camera movement connects the exam and project studios, preserving the original transition.',
    description:
      'An edited excerpt from the original portrait brand recording: facade movement connects exam and project studio scenes. The footage illustrates the landing experience, not working application features.',
  },
  {
    src: '/projects/munjiz-perspective.mp4',
    poster: '/projects/munjiz-perspective.webp',
    width: 464,
    height: 848,
    label: 'Munjiz — The next chapter',
    badge: 'Play scene',
    duration: '00:03.6',
    title: 'From ambition to what’s next.',
    note: 'The career studio moves into the work collection; the cut lands after the final composition settles.',
    description:
      'A selected sequence from the original portrait recording, moving from the career studio into the work collection. An authentic brand sequence, not evidence of backend functionality.',
  },
];
