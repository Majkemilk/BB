import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
export const isTablet = width >= 768;
export const isLargeTablet = width >= 1024;
export const isLandscape = width > height;
export const isSmallScreen = width < 375;
export const isMediumScreen = width >= 375 && width < 768;
export const isLargeScreen = width >= 1024;

// Device type detection
export const getDeviceType = () => {
  if (isLargeTablet) return 'largeTablet';
  if (isTablet) return 'tablet';
  if (isMediumScreen) return 'mediumPhone';
  return 'smallPhone';
};

// Responsive value helper
export const getResponsiveValue = <T>(
  mobile: T,
  tablet: T,
  largeTablet?: T
): T => {
  if (isLargeTablet && largeTablet !== undefined) return largeTablet;
  if (isTablet) return tablet;
  return mobile;
};

// Responsive dimensions
export const getResponsiveDimensions = () => ({
  width,
  height,
  isTablet,
  isLargeTablet,
  isLandscape,
  deviceType: getDeviceType(),
});

// Grid columns based on screen size
export const getGridColumns = () => {
  if (isLargeTablet) return 3;
  if (isTablet) return 2;
  return 1;
};

// Responsive spacing
export const getResponsiveSpacing = () => ({
  xs: getResponsiveValue(4, 6, 8),
  sm: getResponsiveValue(8, 12, 16),
  md: getResponsiveValue(12, 16, 20),
  lg: getResponsiveValue(16, 20, 24),
  xl: getResponsiveValue(20, 24, 32),
});

// Responsive font sizes
export const getResponsiveFontSizes = () => ({
  xs: getResponsiveValue(10, 12, 14),
  sm: getResponsiveValue(12, 14, 16),
  md: getResponsiveValue(14, 16, 18),
  lg: getResponsiveValue(16, 18, 20),
  xl: getResponsiveValue(18, 20, 24),
  xxl: getResponsiveValue(20, 24, 28),
  xxxl: getResponsiveValue(24, 28, 32),
});

// Responsive icon sizes
export const getResponsiveIconSizes = () => ({
  sm: getResponsiveValue(16, 20, 24),
  md: getResponsiveValue(20, 24, 28),
  lg: getResponsiveValue(24, 28, 32),
  xl: getResponsiveValue(28, 32, 36),
});

// Modal dimensions
export const getModalDimensions = () => ({
  width: getResponsiveValue('95%', '80%', '70%'),
  maxWidth: getResponsiveValue(400, 600, 800),
  height: getResponsiveValue('80%', '70%', '60%'),
});

// Tab bar dimensions
export const getTabBarDimensions = () => ({
  height: getResponsiveValue(80, 100, 120),
  paddingBottom: getResponsiveValue(20, 30, 40),
  paddingTop: getResponsiveValue(8, 12, 16),
  iconSize: getResponsiveValue(20, 24, 28),
  fontSize: getResponsiveValue(12, 14, 16),
});

// Card dimensions
export const getCardDimensions = () => ({
  padding: getResponsiveValue(12, 16, 20),
  margin: getResponsiveValue(8, 12, 16),
  borderRadius: getResponsiveValue(8, 12, 16),
  minHeight: getResponsiveValue(80, 100, 120),
});

// List item dimensions
export const getListItemDimensions = () => ({
  padding: getResponsiveValue(12, 16, 20),
  margin: getResponsiveValue(4, 8, 12),
  borderRadius: getResponsiveValue(8, 12, 16),
  minHeight: getResponsiveValue(60, 80, 100),
});

// Button dimensions
export const getButtonDimensions = () => ({
  paddingHorizontal: getResponsiveValue(16, 20, 24),
  paddingVertical: getResponsiveValue(12, 16, 20),
  borderRadius: getResponsiveValue(8, 12, 16),
  minHeight: getResponsiveValue(44, 48, 52),
  fontSize: getResponsiveValue(14, 16, 18),
});

// Input dimensions
export const getInputDimensions = () => ({
  paddingHorizontal: getResponsiveValue(12, 16, 20),
  paddingVertical: getResponsiveValue(12, 16, 20),
  borderRadius: getResponsiveValue(8, 12, 16),
  minHeight: getResponsiveValue(44, 48, 52),
  fontSize: getResponsiveValue(14, 16, 18),
});

// FAB dimensions
export const getFABDimensions = () => ({
  size: getResponsiveValue(56, 64, 72),
  borderRadius: getResponsiveValue(28, 32, 36),
  iconSize: getResponsiveValue(24, 28, 32),
});

// Header dimensions
export const getHeaderDimensions = () => ({
  height: getResponsiveValue(60, 80, 100),
  paddingHorizontal: getResponsiveValue(16, 20, 24),
  paddingVertical: getResponsiveValue(12, 16, 20),
  fontSize: getResponsiveValue(18, 20, 24),
});

// Search bar dimensions
export const getSearchBarDimensions = () => ({
  height: getResponsiveValue(40, 48, 56),
  paddingHorizontal: getResponsiveValue(12, 16, 20),
  borderRadius: getResponsiveValue(8, 12, 16),
  fontSize: getResponsiveValue(14, 16, 18),
});

// Filter button dimensions
export const getFilterButtonDimensions = () => ({
  paddingHorizontal: getResponsiveValue(12, 16, 20),
  paddingVertical: getResponsiveValue(8, 12, 16),
  borderRadius: getResponsiveValue(6, 8, 10),
  fontSize: getResponsiveValue(12, 14, 16),
});

// Empty state dimensions
export const getEmptyStateDimensions = () => ({
  padding: getResponsiveValue(40, 60, 80),
  iconSize: getResponsiveValue(48, 64, 80),
  titleSize: getResponsiveValue(18, 20, 24),
  subtitleSize: getResponsiveValue(14, 16, 18),
});

// Grid item dimensions
export const getGridItemDimensions = () => ({
  width: isTablet ? '48%' : '100%',
  marginBottom: getResponsiveValue(16, 20, 24),
  padding: getResponsiveValue(12, 16, 20),
  borderRadius: getResponsiveValue(8, 12, 16),
});

// Landscape adjustments
export const getLandscapeAdjustments = () => ({
  headerHeight: isLandscape ? getResponsiveValue(50, 60, 70) : getHeaderDimensions().height,
  tabBarHeight: isLandscape ? getResponsiveValue(60, 70, 80) : getTabBarDimensions().height,
  modalHeight: isLandscape ? '90%' : getModalDimensions().height,
  gridColumns: isLandscape ? getResponsiveValue(2, 3, 4) : getGridColumns(),
  // Landscape-specific spacing
  landscapeSpacing: {
    xs: getResponsiveValue(2, 4, 6),
    sm: getResponsiveValue(4, 6, 8),
    md: getResponsiveValue(6, 8, 10),
    lg: getResponsiveValue(8, 10, 12),
    xl: getResponsiveValue(10, 12, 14),
  },
  // Landscape-specific font sizes
  landscapeFontSizes: {
    xs: getResponsiveValue(8, 10, 12),
    sm: getResponsiveValue(10, 12, 14),
    md: getResponsiveValue(12, 14, 16),
    lg: getResponsiveValue(14, 16, 18),
    xl: getResponsiveValue(16, 18, 20),
    xxl: getResponsiveValue(18, 20, 24),
  },
  // Landscape-specific modal dimensions
  landscapeModalDimensions: {
    width: isLandscape ? '95%' : getModalDimensions().width,
    maxWidth: isLandscape ? 1200 : getModalDimensions().maxWidth,
    height: isLandscape ? '85%' : getModalDimensions().height,
  },
  // Landscape-specific grid layout
  landscapeGridLayout: {
    columns: isLandscape ? getResponsiveValue(3, 4, 5) : getGridColumns(),
    itemSpacing: isLandscape ? getResponsiveValue(8, 12, 16) : getResponsiveSpacing().sm,
    containerPadding: isLandscape ? getResponsiveValue(12, 16, 20) : getResponsiveSpacing().md,
  },
});

// Export all responsive utilities
export const ResponsiveUtils = {
  getResponsiveValue,
  getResponsiveDimensions,
  getGridColumns,
  getResponsiveSpacing,
  getResponsiveFontSizes,
  getResponsiveIconSizes,
  getModalDimensions,
  getTabBarDimensions,
  getCardDimensions,
  getListItemDimensions,
  getButtonDimensions,
  getInputDimensions,
  getFABDimensions,
  getHeaderDimensions,
  getSearchBarDimensions,
  getFilterButtonDimensions,
  getEmptyStateDimensions,
  getGridItemDimensions,
  getLandscapeAdjustments,
  isTablet,
  isLargeTablet,
  isLandscape,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  getDeviceType,
};

