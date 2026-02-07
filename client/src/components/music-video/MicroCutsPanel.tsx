/**
 * MicroCuts Panel - Panel de Control de Microcortes en Timeline
 * 
 * Permite al usuario configurar la intensidad y tipos de microcortes
 * que se inyectarán en los prompts de Kling al generar videos.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Zap, 
  Settings2, 
  Music, 
  Clapperboard, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Volume2,
  Film,
  RotateCcw,
} from 'lucide-react';
import {
  type MicroCutConfig,
  type MicroCutEffect,
  type EditIntensity,
  type MicroCutPlan,
  getDefaultMicroCutConfig,
  getAvailableEffects,
} from '../../lib/api/micro-cuts-engine';

// ============================================================
// PROPS
// ============================================================

interface MicroCutsPanelProps {
  config: MicroCutConfig;
  onConfigChange: (config: MicroCutConfig) => void;
  onApplyMicroCuts?: () => void;      // Aplicar microcortes: cortar clips en el timeline
  plans?: Map<number | string, MicroCutPlan>;  // Planes actuales
  genre?: string;
  bpm?: number;
  totalClips?: number;
  isApplying?: boolean;               // Estado de procesamiento
  className?: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function MicroCutsPanel({
  config,
  onConfigChange,
  onApplyMicroCuts,
  plans,
  genre,
  bpm,
  totalClips = 0,
  isApplying = false,
  className = '',
}: MicroCutsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEffectDetails, setShowEffectDetails] = useState(false);

  const availableEffects = useMemo(() => getAvailableEffects(), []);

  // Stats from current plans
  const planStats = useMemo(() => {
    if (!plans || plans.size === 0) return null;
    
    const allEffects: string[] = [];
    let totalEffects = 0;
    
    plans.forEach(plan => {
      totalEffects += plan.totalEffects;
      plan.effects.forEach(e => allEffects.push(e.effect));
    });

    const effectCounts = allEffects.reduce((acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEffects,
      avgPerClip: plans.size > 0 ? (totalEffects / plans.size).toFixed(1) : '0',
      topEffects: Object.entries(effectCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count })),
    };
  }, [plans]);

  const handleToggle = useCallback(() => {
    onConfigChange({ ...config, enabled: !config.enabled });
  }, [config, onConfigChange]);

  const handleIntensityChange = useCallback((intensity: EditIntensity) => {
    onConfigChange({ ...config, intensity });
  }, [config, onConfigChange]);

  const handleBeatSyncToggle = useCallback(() => {
    onConfigChange({ ...config, beatSync: !config.beatSync });
  }, [config, onConfigChange]);

  const handleNarrativeToggle = useCallback(() => {
    onConfigChange({ ...config, respectNarrative: !config.respectNarrative });
  }, [config, onConfigChange]);

  const handleEffectToggle = useCallback((effect: MicroCutEffect) => {
    const current = config.allowedEffects;
    const newEffects = current.includes(effect)
      ? current.filter(e => e !== effect)
      : [...current, effect];
    onConfigChange({ ...config, allowedEffects: newEffects });
  }, [config, onConfigChange]);

  const handleReset = useCallback(() => {
    onConfigChange(getDefaultMicroCutConfig(genre, bpm));
  }, [genre, bpm, onConfigChange]);

  const intensityColors: Record<EditIntensity, string> = {
    subtle: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    medium: 'bg-green-500/20 text-green-300 border-green-500/40',
    aggressive: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    extreme: 'bg-red-500/20 text-red-300 border-red-500/40',
  };

  const intensityLabels: Record<EditIntensity, string> = {
    subtle: '🎵 Sutil',
    medium: '🎬 Medio',
    aggressive: '⚡ Agresivo',
    extreme: '🔥 Extremo',
  };

  const effectIcons: Record<string, string> = {
    'camera': '📷',
    'speed': '⏱️',
    'transition': '🔄',
    'effect': '✨',
  };

  return (
    <div className={`micro-cuts-panel ${className}`} style={{
      background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(25, 15, 45, 0.95))',
      borderRadius: '12px',
      border: config.enabled ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(100, 100, 130, 0.3)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header - Always visible */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap 
            size={16} 
            style={{ 
              color: config.enabled ? '#a855f7' : '#666',
              filter: config.enabled ? 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.5))' : 'none',
            }} 
          />
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: config.enabled ? '#e2e8f0' : '#888',
          }}>
            Microcortes
          </span>
          {config.enabled && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: intensityColors[config.intensity].includes('bg-') 
                ? undefined : 'rgba(168, 85, 247, 0.2)',
              color: '#a855f7',
              fontWeight: 500,
            }} className={intensityColors[config.intensity]}>
              {intensityLabels[config.intensity]}
            </span>
          )}
          {planStats && config.enabled && (
            <span style={{
              fontSize: '10px',
              color: '#888',
            }}>
              {planStats.totalEffects} fx en {totalClips} clips
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Toggle ON/OFF */}
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              border: 'none',
              background: config.enabled ? '#a855f7' : '#333',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '2px',
              left: config.enabled ? '18px' : '2px',
              transition: 'left 0.2s',
            }} />
          </button>

          {isExpanded ? <ChevronUp size={14} color="#888" /> : <ChevronDown size={14} color="#888" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && config.enabled && (
        <div style={{ 
          padding: '0 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Intensity Selector */}
          <div>
            <label style={{ fontSize: '11px', color: '#888', marginBottom: '6px', display: 'block' }}>
              <Settings2 size={11} style={{ display: 'inline', marginRight: '4px' }} />
              Intensidad de Edición
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['subtle', 'medium', 'aggressive', 'extreme'] as EditIntensity[]).map(level => (
                <button
                  key={level}
                  onClick={() => handleIntensityChange(level)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '10px',
                    fontWeight: config.intensity === level ? 600 : 400,
                    borderRadius: '6px',
                    border: config.intensity === level 
                      ? '1px solid rgba(168, 85, 247, 0.6)' 
                      : '1px solid rgba(100, 100, 130, 0.3)',
                    background: config.intensity === level 
                      ? 'rgba(168, 85, 247, 0.15)' 
                      : 'rgba(30, 30, 50, 0.5)',
                    color: config.intensity === level ? '#c084fc' : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {intensityLabels[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Settings */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBeatSyncToggle}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                fontSize: '10px',
                borderRadius: '6px',
                border: config.beatSync 
                  ? '1px solid rgba(34, 197, 94, 0.4)' 
                  : '1px solid rgba(100, 100, 130, 0.3)',
                background: config.beatSync 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(30, 30, 50, 0.5)',
                color: config.beatSync ? '#86efac' : '#888',
                cursor: 'pointer',
              }}
            >
              <Music size={12} />
              Beat Sync
            </button>
            <button
              onClick={handleNarrativeToggle}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                fontSize: '10px',
                borderRadius: '6px',
                border: config.respectNarrative 
                  ? '1px solid rgba(59, 130, 246, 0.4)' 
                  : '1px solid rgba(100, 100, 130, 0.3)',
                background: config.respectNarrative 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : 'rgba(30, 30, 50, 0.5)',
                color: config.respectNarrative ? '#93c5fd' : '#888',
                cursor: 'pointer',
              }}
            >
              <Film size={12} />
              Narrativa
            </button>
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                fontSize: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(100, 100, 130, 0.3)',
                background: 'rgba(30, 30, 50, 0.5)',
                color: '#888',
                cursor: 'pointer',
              }}
              title="Restaurar configuración por defecto"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Genre & BPM Info */}
          {(genre || bpm) && (
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(30, 30, 50, 0.5)',
              border: '1px solid rgba(100, 100, 130, 0.2)',
            }}>
              {genre && (
                <span style={{ fontSize: '10px', color: '#a78bfa' }}>
                  🎵 {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </span>
              )}
              {bpm && (
                <span style={{ fontSize: '10px', color: '#86efac' }}>
                  ♩ {bpm} BPM
                </span>
              )}
              {totalClips > 0 && (
                <span style={{ fontSize: '10px', color: '#93c5fd' }}>
                  🎬 {totalClips} clips
                </span>
              )}
            </div>
          )}

          {/* Effects Selection */}
          <div>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '6px',
                cursor: 'pointer',
              }}
              onClick={() => setShowEffectDetails(!showEffectDetails)}
            >
              <label style={{ fontSize: '11px', color: '#888' }}>
                <Sparkles size={11} style={{ display: 'inline', marginRight: '4px' }} />
                Efectos ({config.allowedEffects.length} activos)
              </label>
              {showEffectDetails ? <ChevronUp size={12} color="#888" /> : <ChevronDown size={12} color="#888" />}
            </div>

            {showEffectDetails && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '3px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {availableEffects.map(effect => {
                  const isActive = config.allowedEffects.includes(effect.id);
                  return (
                    <button
                      key={effect.id}
                      onClick={() => handleEffectToggle(effect.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        border: isActive 
                          ? '1px solid rgba(168, 85, 247, 0.4)' 
                          : '1px solid rgba(60, 60, 80, 0.3)',
                        background: isActive 
                          ? 'rgba(168, 85, 247, 0.1)' 
                          : 'rgba(20, 20, 35, 0.5)',
                        color: isActive ? '#c084fc' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'left',
                      }}
                      title={effect.description}
                    >
                      <span>{effectIcons[effect.category] || '🎬'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {effect.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Plan Stats */}
          {planStats && (
            <div style={{
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <div style={{ fontSize: '10px', color: '#a78bfa', marginBottom: '4px', fontWeight: 600 }}>
                📊 Plan Actual
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#888' }}>
                <span>Total: <b style={{ color: '#c084fc' }}>{planStats.totalEffects}</b> fx</span>
                <span>Promedio: <b style={{ color: '#c084fc' }}>{planStats.avgPerClip}</b>/clip</span>
              </div>
              {planStats.topEffects.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {planStats.topEffects.map(({ name, count }) => (
                    <span key={name} style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#a78bfa',
                    }}>
                      {name} ×{count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⚡ APPLY MICROCUTS BUTTON - Cortar clips en el timeline */}
          {onApplyMicroCuts && totalClips > 0 && (
            <button
              onClick={onApplyMicroCuts}
              disabled={isApplying || !config.enabled}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                background: isApplying 
                  ? 'rgba(168, 85, 247, 0.1)' 
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.3))',
                color: isApplying ? '#888' : '#e2e8f0',
                cursor: isApplying ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                letterSpacing: '0.5px',
              }}
            >
              {isApplying ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Aplicando microcortes...
                </>
              ) : (
                <>
                  ⚡ Aplicar Microcortes al Timeline ({totalClips} clips)
                </>
              )}
            </button>
          )}

          {/* Info Footer */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '6px',
            padding: '6px 8px',
            borderRadius: '6px',
            background: 'rgba(30, 50, 70, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
          }}>
            <Info size={12} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '9px', color: '#94a3b8', lineHeight: '1.4' }}>
              Los microcortes dividen cada clip en segmentos con efectos cinematográficos únicos. 
              Pulsa "Aplicar" para cortar los clips según la intensidad y efectos seleccionados.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MicroCutsPanel;
