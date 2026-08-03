import { Capacitor } from '@capacitor/core';

// No-op on web (no vibration API dependency to manage there); gives real
// tactile feedback on native platforms for key interactions, which is
// part of what separates a "wrapped website" from an app that feels
// native - relevant both for user experience and for avoiding an App
// Store Guideline 4.2 (Minimum Functionality) rejection risk.
async function impact(style) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle[style] });
  } catch (err) {
    // Never let haptics failure affect the actual interaction.
  }
}

export const haptics = {
  light: () => impact('Light'),
  medium: () => impact('Medium'),
  heavy: () => impact('Heavy'),
};

export default haptics;
