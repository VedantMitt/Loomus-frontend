export default function HobbyAnimatedBg({ seed }: { seed: number }) {
  // Use the seed to slightly randomize the colors and animation speeds so cards don't look identical
  const colors = [
    ["#f472b6", "#06b6d4", "#8b5cf6"], // Pink, Cyan, Purple
    ["#fbbf24", "#ef4444", "#ec4899"], // Amber, Red, Pink
    ["#34d399", "#3b82f6", "#8b5cf6"], // Emerald, Blue, Purple
    ["#fb923c", "#f43f5e", "#a855f7"], // Orange, Rose, Purple
  ];

  const palette = colors[seed % colors.length];

  return (
    <svg 
      viewBox="0 0 400 300" 
      preserveAspectRatio="none" 
      className="live-img" 
      style={{ background: '#0a0a12', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`blur-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
      </defs>
      
      {/* Blob 1 */}
      <circle cx="100" cy="100" r="100" fill={palette[0]} filter={`url(#blur-${seed})`} opacity="0.6">
        <animate attributeName="cx" values="100;300;100" dur={`${10 + (seed % 5)}s`} repeatCount="indefinite" />
        <animate attributeName="cy" values="100;200;100" dur={`${12 + (seed % 3)}s`} repeatCount="indefinite" />
      </circle>
      
      {/* Blob 2 */}
      <circle cx="300" cy="200" r="120" fill={palette[1]} filter={`url(#blur-${seed})`} opacity="0.6">
        <animate attributeName="cx" values="300;100;300" dur={`${15 + (seed % 4)}s`} repeatCount="indefinite" />
        <animate attributeName="cy" values="200;50;200" dur={`${11 + (seed % 2)}s`} repeatCount="indefinite" />
      </circle>
      
      {/* Blob 3 */}
      <circle cx="200" cy="150" r="140" fill={palette[2]} filter={`url(#blur-${seed})`} opacity="0.5">
        <animate attributeName="cx" values="200;50;350;200" dur={`${18 + (seed % 3)}s`} repeatCount="indefinite" />
        <animate attributeName="cy" values="150;250;50;150" dur={`${14 + (seed % 4)}s`} repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
