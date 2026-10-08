"use client";
import { useState } from "react";

export default function CompanyLogo({ src, fallbackSrc, alt, className }) {
  const [error, setError] = useState(false);
  
  return (
    <img 
      src={error ? fallbackSrc : src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}
