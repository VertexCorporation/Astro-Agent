import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path
        d="M9.02 0C9.44 0 9.84 0.17 10.14 0.46L15.53 5.85C15.83 6.15 15.99 6.55 15.99 6.97V9.02C15.99 9.44 15.83 9.84 15.53 10.14L10.14 15.53C9.84 15.83 9.44 15.99 9.02 15.99H6.97C6.55 15.99 6.15 15.83 5.85 15.53L0.46 10.14C0.17 9.84 0 9.44 0 9.02V6.97C0 6.55 0.17 6.15 0.46 5.85L5.85 0.46C6.15 0.17 6.55 0 6.97 0H9.02ZM9.12 4.28C8.5 3.66 7.5 3.66 6.88 4.28L4.28 6.88C3.66 7.5 3.66 8.5 4.28 9.12L6.88 11.71C7.5 12.33 8.5 12.33 9.12 11.71L11.71 9.12C12.33 8.5 12.33 7.5 11.71 6.88L9.12 4.28Z"
        fill="currentColor"
      />
    </svg>
  );
}
