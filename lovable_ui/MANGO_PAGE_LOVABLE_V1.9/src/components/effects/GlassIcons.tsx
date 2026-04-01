import React from 'react';
import './GlassIcons.css';

export interface GlassIconsItem {
  icon: React.ReactElement | string; // ReactElement or image URL
  color: string;
  label: string;
  sublabel?: string;
  customClass?: string;
}

export interface GlassIconsProps {
  items: GlassIconsItem[];
  className?: string;
}

const gradientMapping: Record<string, string> = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  teal: 'linear-gradient(hsl(168, 72%, 42%), hsl(180, 70%, 35%))',
};

const GlassIcons: React.FC<GlassIconsProps> = ({ items, className }) => {
  const getBackgroundStyle = (color: string): React.CSSProperties => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };

  return (
    <div className={`icon-btns ${className || ''}`}>
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          className={`icon-btn ${item.customClass || ''}`}
          aria-label={item.label}
        >
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)} />
          <span className="icon-btn__icon" style={getBackgroundStyle(item.color)}>
            {typeof item.icon === 'string' ? (
              <img src={item.icon} alt={item.label} />
            ) : (
              item.icon
            )}
          </span>
          <span className="icon-btn__label">{item.label}</span>
          {item.sublabel && <span className="icon-btn__sublabel">{item.sublabel}</span>}
        </button>
      ))}
    </div>
  );
};

export default GlassIcons;
