import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

interface OrientationState {
  isLandscape: boolean;
  isPortrait: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export function useOrientation(): OrientationState {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    
    return {
      isLandscape,
      isPortrait: !isLandscape,
      width,
      height,
      orientation: isLandscape ? 'landscape' : 'portrait',
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      const isLandscape = width > height;
      
      setOrientation({
        isLandscape,
        isPortrait: !isLandscape,
        width,
        height,
        orientation: isLandscape ? 'landscape' : 'portrait',
      });
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
}
