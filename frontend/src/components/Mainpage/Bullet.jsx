import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Bullet({ children, className = '', color = 'text-green-500' }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <CheckCircle2 className={`h-5 w-5 ${color} flex-shrink-0`} />
      <span className="text-gray-700" style={{ color: '#666' }}>
        {children}
      </span>
    </div>
  );
} 