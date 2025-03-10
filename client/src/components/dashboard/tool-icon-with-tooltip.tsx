import React from 'react';
import { Link } from 'wouter';
import './tooltips.css';

interface ToolIconWithTooltipProps {
  tool: {
    id: string;
    name: string;
    description: string;
    icon: any;
    route: string;
    stats: number;
    statsLabel: string;
    color: string;
  };
  onSelect: (id: string) => void;
}

export const ToolIconWithTooltip: React.FC<ToolIconWithTooltipProps> = ({ tool, onSelect }) => {
  const Icon = tool.icon;
  
  return (
    <Link href={tool.route}>
      <div 
        className="h-14 w-14 rounded-full bg-background/40 backdrop-blur-md border border-orange-500/30 shadow-lg flex flex-col items-center justify-center cursor-pointer tool-icon-wrapper"
        onClick={() => onSelect(tool.id)}
        title={tool.name}
      >
        <Icon className={`h-6 w-6 ${tool.color}`} />
        
        {/* Etiqueta fija (ahora oculta vía CSS) */}
        <div className="ecosystem-tool-label">
          {tool.name}
        </div>
        
        {/* Tooltip detallado (se muestra al hacer hover) */}
        <div className="tool-tooltip">
          <div className="tool-tooltip-title">
            <Icon className={`h-4 w-4 ${tool.color}`} />
            {tool.name}
          </div>
          <div className="tool-tooltip-description">
            {tool.description}
          </div>
          <div className="tool-tooltip-stats">
            <span className="tool-tooltip-stats-value">{tool.stats}</span>
            <span className="tool-tooltip-stats-label">{tool.statsLabel}</span>
          </div>
          <div className="tool-tooltip-action">
            Click to open
          </div>
        </div>
      </div>
    </Link>
  );
};