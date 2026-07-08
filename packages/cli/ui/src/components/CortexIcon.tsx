interface Props {
  size?: number;
  className?: string;
}

export function CortexIcon({ size = 24, className = '' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5.64" y1="5.64" x2="8.49" y2="8.49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.51" y1="15.51" x2="18.36" y2="18.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="15.51" y2="8.49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8.49" y1="15.51" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
