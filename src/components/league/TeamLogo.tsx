import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getTeamIconUrl, getTeamIconSvgUrl } from '@/lib/teamIcons';

interface TeamLogoProps {
  teamName: string;
  size?: number;
  className?: string;
  useSvg?: boolean;
}

export const TeamLogo = ({
  teamName,
  size = 40,
  className,
  useSvg = true,
}: TeamLogoProps) => {
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Only try to load SVG if useSvg is true
  useEffect(() => {
    if (!useSvg) return;

    const url = getTeamIconSvgUrl(teamName);
    if (!url) {
      setError(true);
      return;
    }

    // Verify the SVG exists
    fetch(url, { method: 'HEAD' })
      .then(res => {
        if (res.ok) setSvgUrl(url);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [teamName, useSvg]);

  // If we're using SVG and have a valid URL
  if (useSvg && svgUrl) {
    return (
      <img
        src={svgUrl}
        alt={`${teamName} logo`}
        className={cn('object-contain', className)}
        style={{ width: size, height: size }}
        loading="lazy"
        draggable={false}
      />
    );
  }

  // Fallback to PNG
  return (
    <img
      src={getTeamIconUrl(teamName, size)}
      alt={`${teamName} logo`}
      className={cn('object-contain', className)}
      style={{ width: size, height: size }}
      loading="lazy"
      draggable={false}
    />
  );
};

export default TeamLogo;
