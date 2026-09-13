/**
 * @nova/animation
 * Animation engine — keyframes, timeline, transitions.
 * Stub implementation — foundation for future development.
 */

export interface Keyframe {
  time: number; // ms
  properties: Record<string, unknown>;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AnimationTrack {
  objectId: string;
  keyframes: Keyframe[];
}

export interface Timeline {
  id: string;
  duration: number; // ms
  tracks: AnimationTrack[];
}
