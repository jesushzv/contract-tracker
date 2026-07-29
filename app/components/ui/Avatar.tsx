import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md' }) => {
  // Deterministic color based on name
  const colors = [
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-amber-100 text-amber-800',
    'bg-emerald-100 text-emerald-800',
    'bg-cyan-100 text-cyan-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-violet-100 text-violet-800',
    'bg-purple-100 text-purple-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-pink-100 text-pink-800',
    'bg-rose-100 text-rose-800'
  ];
  
  const charCode = name.charCodeAt(0) || 0;
  const colorIndex = charCode % colors.length;
  const colorClass = colors[colorIndex];
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-full font-semibold ${sizes[size]} ${colorClass}`}>
      {initials}
    </div>
  );
};
