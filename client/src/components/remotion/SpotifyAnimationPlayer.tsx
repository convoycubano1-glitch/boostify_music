import React from 'react';
import { Player } from '@remotion/player';
import { SpotifyBoostAnimation } from './SpotifyBoostAnimation';

interface SpotifyAnimationPlayerProps {
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SpotifyAnimationPlayer - Displays the Remotion animation for Spotify page
 * 
 * This component wraps the Remotion Player to show a beautiful animation
 * demonstrating how the Spotify Growth Tools work.
 * 
 * Animation scenes:
 * 1. Welcome screen with Spotify branding
 * 2. AI Tools showcase
 * 3. Playlist matching demo
 * 4. Growth metrics and stats
 * 5. Call to action
 * 
 * Total duration: 540 frames at 30fps = 18 seconds
 */
export const SpotifyAnimationPlayer: React.FC<SpotifyAnimationPlayerProps> = ({
  width = '100%',
  height = 400,
  autoPlay = true,
  loop = true,
  className = '',
  style = {},
}) => {
  const durationInFrames = 540;
  const fps = 30;

  return (
    <div 
      className={`spotify-animation-container ${className}`}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.2), rgba(25, 20, 20, 0.4))',
        boxShadow: '0 25px 50px -12px rgba(29, 185, 84, 0.3)',
        border: '1px solid rgba(29, 185, 84, 0.3)',
        ...style,
      }}
    >
      <Player
        component={SpotifyBoostAnimation}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={800}
        compositionHeight={500}
        style={{
          width: typeof width === 'number' ? width : width,
          height: typeof height === 'number' ? height : height,
        }}
        autoPlay={autoPlay}
        loop={loop}
        controls={false}
        showVolumeControls={false}
      />
    </div>
  );
};

export default SpotifyAnimationPlayer;
