import React from 'react';
import { Panel, Direction, PANEL_LABELS } from '../types';

interface VehicleDiagramProps {
  targetPanel?: Panel;
  activePanel?: Panel;
  targetDirection?: Direction;
  interactive?: boolean;
  onSelectPanel?: (panel: Panel) => void;
  damagesByPanel?: Record<string, number>;
}

export const VehicleDiagram: React.FC<VehicleDiagramProps> = ({
  targetPanel,
  activePanel,
  targetDirection,
  interactive = false,
  onSelectPanel,
  damagesByPanel = {},
}) => {
  const getPanelFill = (panelKey: Panel) => {
    const isTarget = targetPanel === panelKey;
    const isActive = activePanel === panelKey;
    const damageCount = damagesByPanel[panelKey] || 0;

    if (damageCount > 0) {
      return isActive ? '#ef4444' : '#f87171'; // Red for damage
    }
    if (isTarget) {
      return '#38bdf8'; // Sky blue highlight for challenge target
    }
    if (isActive) {
      return '#0284c7';
    }
    return '#1e293b'; // Default sleek dark slate
  };

  const getPanelStroke = (panelKey: Panel) => {
    if (targetPanel === panelKey) return '#0ea5e9';
    if (activePanel === panelKey) return '#38bdf8';
    if ((damagesByPanel[panelKey] || 0) > 0) return '#b91c1c';
    return '#334155';
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Direction & Challenge Indicator Banner */}
      {targetDirection && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Walkaround Protocol: </span>
          <span className="text-white font-bold uppercase tracking-wider">
            {targetDirection === 'clockwise' ? '↻ Clockwise' : '↺ Counter-Clockwise'}
          </span>
          {targetPanel && (
            <span className="text-slate-400 font-normal">
              • Start at <span className="text-cyan-200 font-semibold">{PANEL_LABELS[targetPanel]}</span>
            </span>
          )}
        </div>
      )}

      {/* SVG Overhead Schematic of Modern Vehicle */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[1/2] p-2">
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
        >
          {/* Subtle directional orbit arrow */}
          {targetDirection && (
            <path
              d={
                targetDirection === 'clockwise'
                  ? 'M 100,20 A 80,180 0 1,1 99,20'
                  : 'M 100,20 A 80,180 0 1,0 101,20'
              }
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
              className="opacity-70 animate-pulse"
            />
          )}

          {/* Direction Start Arrowhead Pin */}
          {targetPanel && (
            <g>
              <circle cx="100" cy="30" r="10" fill="#0284c7" className="animate-ping opacity-30" />
              <circle cx="100" cy="30" r="6" fill="#38bdf8" />
            </g>
          )}

          {/* Tires / Wheels */}
          {/* Driver Front Wheel */}
          <rect
            x="14"
            y="70"
            width="18"
            height="42"
            rx="4"
            fill={getPanelFill('wheel_driver_front')}
            stroke={getPanelStroke('wheel_driver_front')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('wheel_driver_front')}
          />
          {/* Passenger Front Wheel */}
          <rect
            x="168"
            y="70"
            width="18"
            height="42"
            rx="4"
            fill={getPanelFill('wheel_passenger_front')}
            stroke={getPanelStroke('wheel_passenger_front')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('wheel_passenger_front')}
          />
          {/* Driver Rear Wheel */}
          <rect
            x="14"
            y="280"
            width="18"
            height="42"
            rx="4"
            fill={getPanelFill('wheel_driver_rear')}
            stroke={getPanelStroke('wheel_driver_rear')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('wheel_driver_rear')}
          />
          {/* Passenger Rear Wheel */}
          <rect
            x="168"
            y="280"
            width="18"
            height="42"
            rx="4"
            fill={getPanelFill('wheel_passenger_rear')}
            stroke={getPanelStroke('wheel_passenger_rear')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('wheel_passenger_rear')}
          />

          {/* Vehicle Outer Shell Chassis */}
          {/* Front Bumper & Grille */}
          <path
            d="M 50,42 Q 100,28 150,42 L 155,62 Q 100,56 45,62 Z"
            fill={getPanelFill('front_bumper')}
            stroke={getPanelStroke('front_bumper')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('front_bumper')}
          />

          {/* Hood */}
          <path
            d="M 45,64 Q 100,58 155,64 L 158,118 Q 100,116 42,118 Z"
            fill={getPanelFill('hood')}
            stroke={getPanelStroke('hood')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('hood')}
          />

          {/* Windshield */}
          <path
            d="M 42,120 Q 100,118 158,120 L 152,156 Q 100,152 48,156 Z"
            fill={getPanelFill('windshield')}
            stroke={getPanelStroke('windshield')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('windshield')}
          />

          {/* Side Mirrors */}
          <polygon
            points="30,132 40,126 40,140"
            fill={getPanelFill('driver_mirror')}
            stroke={getPanelStroke('driver_mirror')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('driver_mirror')}
          />
          <polygon
            points="170,132 160,126 160,140"
            fill={getPanelFill('passenger_mirror')}
            stroke={getPanelStroke('passenger_mirror')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('passenger_mirror')}
          />

          {/* Roof */}
          <path
            d="M 48,158 Q 100,154 152,158 L 152,246 Q 100,246 48,246 Z"
            fill={getPanelFill('roof')}
            stroke={getPanelStroke('roof')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('roof')}
          />

          {/* Left / Driver Side Doors & Fenders */}
          {/* Driver Front Fender */}
          <path
            d="M 36,65 L 44,65 L 41,120 L 35,120 Z"
            fill={getPanelFill('driver_fender')}
            stroke={getPanelStroke('driver_fender')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('driver_fender')}
          />
          {/* Driver Front Door */}
          <path
            d="M 34,122 L 47,122 L 47,192 L 34,192 Z"
            fill={getPanelFill('driver_front_door')}
            stroke={getPanelStroke('driver_front_door')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('driver_front_door')}
          />
          {/* Driver Rear Door */}
          <path
            d="M 34,194 L 47,194 L 47,260 L 34,260 Z"
            fill={getPanelFill('driver_rear_door')}
            stroke={getPanelStroke('driver_rear_door')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('driver_rear_door')}
          />
          {/* Driver Rear Quarter Panel */}
          <path
            d="M 34,262 L 47,262 L 48,328 L 36,328 Z"
            fill={getPanelFill('driver_quarter_panel')}
            stroke={getPanelStroke('driver_quarter_panel')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('driver_quarter_panel')}
          />

          {/* Right / Passenger Side Doors & Fenders */}
          {/* Passenger Front Fender */}
          <path
            d="M 156,65 L 164,65 L 165,120 L 159,120 Z"
            fill={getPanelFill('passenger_fender')}
            stroke={getPanelStroke('passenger_fender')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('passenger_fender')}
          />
          {/* Passenger Front Door */}
          <path
            d="M 153,122 L 166,122 L 166,192 L 153,192 Z"
            fill={getPanelFill('passenger_front_door')}
            stroke={getPanelStroke('passenger_front_door')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('passenger_front_door')}
          />
          {/* Passenger Rear Door */}
          <path
            d="M 153,194 L 166,194 L 166,260 L 153,260 Z"
            fill={getPanelFill('passenger_rear_door')}
            stroke={getPanelStroke('passenger_rear_door')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('passenger_rear_door')}
          />
          {/* Passenger Rear Quarter Panel */}
          <path
            d="M 153,262 L 166,262 L 164,328 L 152,328 Z"
            fill={getPanelFill('passenger_quarter_panel')}
            stroke={getPanelStroke('passenger_quarter_panel')}
            strokeWidth="1.2"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('passenger_quarter_panel')}
          />

          {/* Trunk & Rear Bumper */}
          <path
            d="M 48,248 Q 100,248 152,248 L 156,334 Q 100,348 44,334 Z"
            fill={getPanelFill('trunk_rear_bumper')}
            stroke={getPanelStroke('trunk_rear_bumper')}
            strokeWidth="1.5"
            className={interactive ? 'cursor-pointer transition-colors hover:brightness-125' : ''}
            onClick={() => interactive && onSelectPanel && onSelectPanel('trunk_rear_bumper')}
          />

          {/* Labels & Front / Rear Orientation Indicators */}
          <text x="100" y="52" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold">
            FRONT
          </text>
          <text x="100" y="324" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold">
            REAR
          </text>
        </svg>
      </div>

      {/* Target Panel Tag */}
      {targetPanel && (
        <div className="mt-2 text-center text-xs text-slate-300">
          Target Initial Panel: <span className="font-semibold text-cyan-400">{PANEL_LABELS[targetPanel]}</span>
        </div>
      )}
    </div>
  );
};
