import React from 'react';
import { Link } from 'wouter';

interface SubscriptionLinkProps {
  href: string;
  children: React.ReactNode;
  requiredPlan?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Simple Link wrapper component
 * Esta versión usa el componente Link de wouter directamente
 * para evitar problemas de renderizado
 */
export function SubscriptionLink({
  href,
  children,
  className = "",
  onClick
}: SubscriptionLinkProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={className}
    >
      {children}
    </Link>
  );
}