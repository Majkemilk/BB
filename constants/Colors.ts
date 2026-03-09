/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// App-wide color palette
export const AppColors = {
  // Primary colors
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#E8F5E9',
  primaryBorder: '#C8E6C9',
  
  // Priority colors
  mustDo: '#FF5252',
  couldDo: '#FFD740',
  later: '#448AFF',
  keyPlant: '#FF5252',
  
  // Status colors
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFD740',
  info: '#448AFF',
  
  // Neutral colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textLight: '#FFFFFF',
  
  // Background colors
  backgroundWhite: '#FFFFFF',
  backgroundGray: '#F8F9FA',
  backgroundLight: '#F1F1F1',
  
  // Border colors
  border: '#EEEEEE',
  borderLight: '#F0F0F0',
  borderDark: '#E0E0E0',
  
  // Semantic colors
  selected: '#E8F5E9',
  selectedText: '#388E3C',
  disabled: '#A5D6A7',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};
