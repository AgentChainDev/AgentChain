import { useState, useEffect } from 'react';

interface ScreenSize {
  width: number;
  height: number;
}

interface ASCIIArtScale {
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  maxWidth: string;
}

export const useResponsiveASCII = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const [asciiScale, setAsciiScale] = useState<ASCIIArtScale>({
    fontSize: 12,
    lineHeight: 1.2,
    letterSpacing: 'normal',
    maxWidth: '100%'
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const calculateASCIIScale = (): ASCIIArtScale => {
      const { width, height } = screenSize;
      
      // Base ASCII art dimensions (approximate)
      const baseASCIIWidth = 80; // characters
      const baseASCIIHeight = 15; // lines
      
      // Calculate available space
      const availableWidth = width - 40; // account for padding
      const availableHeight = height * 0.4; // use 40% of screen height max
      
      // Calculate character width (approximate for monospace)
      const charWidth = 8; // pixels per character (approximate)
      const charHeight = 16; // pixels per line (approximate)
      
      // Calculate maximum font size that fits
      const maxFontSizeByWidth = (availableWidth / baseASCIIWidth) * 0.8; // 80% of calculated size for safety
      const maxFontSizeByHeight = (availableHeight / baseASCIIHeight) * 0.8;
      
      // Use the smaller of the two constraints
      let fontSize = Math.min(maxFontSizeByWidth, maxFontSizeByHeight);
      
      // Set minimum and maximum bounds
      fontSize = Math.max(8, Math.min(fontSize, 24));
      
      // Adjust line height based on font size
      const lineHeight = fontSize <= 10 ? 1.1 : fontSize <= 14 ? 1.2 : 1.3;
      
      // Adjust letter spacing for very small screens
      const letterSpacing = fontSize <= 10 ? '0.5px' : fontSize <= 12 ? 'normal' : '1px';
      
      // Calculate max width to prevent overflow
      const maxWidth = `${Math.min(availableWidth, baseASCIIWidth * charWidth)}px`;
      
      return {
        fontSize: Math.round(fontSize),
        lineHeight,
        letterSpacing,
        maxWidth
      };
    };

    setAsciiScale(calculateASCIIScale());
  }, [screenSize]);

  return {
    screenSize,
    asciiScale,
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024
  };
};
