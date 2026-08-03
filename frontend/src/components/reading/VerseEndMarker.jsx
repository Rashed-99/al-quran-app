import React from 'react';

// 8-pointed star (Rub el Hizb) verse end marker — matches traditional Mushaf style
export default function VerseEndMarker({ verseNumber, size = 38 }) {
  const numStr = String(verseNumber);
  const fontSize = numStr.length >= 3 ? 20 : numStr.length === 2 ? 24 : 30;
  const starPoints = "50,3 61,21 82,17 78,38 97,50 78,62 82,83 61,79 50,97 39,79 18,83 22,62 3,50 22,38 18,17 39,21";

  return (
    <span style={{ display: 'inline-block', width: size, height: size, verticalAlign: 'middle', margin: '0 6px' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label={`Verse ${verseNumber}`}>
        <polygon points={starPoints} fill="#faf6ed" stroke="#c9a24a" strokeWidth="2.5" />
        <polygon points={starPoints} fill="none" stroke="#e8d08a" strokeWidth="0.8" transform="scale(0.82) translate(10.5,10.5)" />
        <text
          x="50" y="54"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill="#1a1a1a"
          fontFamily="sans-serif"
        >
          {numStr}
        </text>
      </svg>
    </span>
  );
}