import React, { useRef } from 'react';
import useAutoScale from '../hooks/useAutoScale';
import { useResponsiveASCII } from '../hooks/useResponsiveASCII';

interface ResponsiveASCIIArtProps {
  children?: React.ReactNode;
  showJapanese?: boolean;
  className?: string;
  style?: React.CSSProperties;
  dangerouslySetInnerHTML?: { __html: string };
}

export const ResponsiveASCIIArt: React.FC<ResponsiveASCIIArtProps> = ({
  children,
  showJapanese = false,
  className = '',
  style = {},
  dangerouslySetInnerHTML
}) => {
  const { asciiScale, isMobile, isTablet, isDesktop } = useResponsiveASCII();
  const preRef = useRef<HTMLPreElement>(null);

  // Use auto-scale hook to ensure content fits
  useAutoScale(preRef, [children, showJapanese], { minScale: 0.1 });

  // Calculate responsive styles
  const responsiveStyles: React.CSSProperties = {
    color: '#ffffff',
    fontFamily: showJapanese
      ? 'Hiragino Sans, Meiryo, MS Gothic, monospace'
      : 'Courier New, monospace',
    fontSize: showJapanese ? `${Math.max(asciiScale.fontSize * 2, 24)}px` : `${asciiScale.fontSize}px`,
    lineHeight: showJapanese ? '1' : asciiScale.lineHeight,
    margin: 0,
    textAlign: 'left',
    background: 'transparent',
    padding: isMobile ? '5px' : '10px',
    borderRadius: '5px',
    letterSpacing: showJapanese ? '8px' : asciiScale.letterSpacing,
    overflow: 'visible',
    whiteSpace: 'pre' as const,
    ...style
  };

  // Add mobile-specific adjustments
  if (isMobile) {
    responsiveStyles.padding = '5px';
    responsiveStyles.fontSize = showJapanese
      ? `${Math.max(asciiScale.fontSize * 1.5, 18)}px`
      : `${Math.max(asciiScale.fontSize * 0.8, 8)}px`;
  }

  // Add tablet-specific adjustments
  if (isTablet) {
    responsiveStyles.padding = '8px';
    responsiveStyles.fontSize = showJapanese
      ? `${Math.max(asciiScale.fontSize * 1.8, 20)}px`
      : `${Math.max(asciiScale.fontSize * 0.9, 10)}px`;
  }

  return (
    <div
      className={`ascii-wrapper ${className}`}
      style={{
        width: '100%',
        overflow: 'visible',
        display: 'block',
        maxWidth: asciiScale.maxWidth,
        margin: '0 auto',
        padding: '0 8px',
        boxSizing: 'border-box'
      }}
    >
      <pre
        ref={preRef}
        style={responsiveStyles}
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      >
        {!dangerouslySetInnerHTML && children}
      </pre>
    </div>
  );
};

export default ResponsiveASCIIArt;
