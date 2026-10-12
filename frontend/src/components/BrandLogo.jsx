import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function BrandLogo({ size = 20 }) {
  return (
    <span className="brand-wordmark">
      <span className="brand-icon-box" aria-hidden="true">
        <ShieldCheck size={size} strokeWidth={2.2} />
      </span>
      <span>
        Honest<span className="brand-accent">Room</span>
      </span>
    </span>
  );
}
