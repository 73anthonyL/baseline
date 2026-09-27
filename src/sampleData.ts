import { ScanRecord, CompareResult } from './types';

// Realistic synthetic frames helper (creates distinct high-fidelity automotive diagrams / perspective representations)
function createSyntheticFrame(
  panelName: string,
  angleText: string,
  damageOverlay?: { label: string; x: number; y: number; w: number; h: number; color: string }
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background concrete / studio tarmac gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 480);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(0.65, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 480);

  // Grid ground markings
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 300);
    ctx.lineTo(i - 100, 480);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(800, 360);
  ctx.stroke();

  // Vehicle Body Silhouette (Metallic Midnight Silver)
  const carGrad = ctx.createLinearGradient(120, 160, 680, 360);
  carGrad.addColorStop(0, '#475569');
  carGrad.addColorStop(0.3, '#64748b');
  carGrad.addColorStop(0.7, '#334155');
  carGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = carGrad;

  // Render stylized modern sedan contour
  ctx.beginPath();
  ctx.roundRect(140, 190, 520, 130, [40, 60, 10, 10]);
  ctx.fill();

  // Roof & Greenhouse glass
  const glassGrad = ctx.createLinearGradient(240, 120, 520, 200);
  glassGrad.addColorStop(0, '#0284c7');
  glassGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(240, 190);
  ctx.quadraticCurveTo(320, 120, 430, 120);
  ctx.quadraticCurveTo(550, 125, 590, 190);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#94a3b8';
  ctx.stroke();

  // Wheels / Rims
  const renderWheel = (cx: number, cy: number) => {
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
  };

  renderWheel(240, 320);
  renderWheel(560, 320);

  // License plate mockup
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(630, 240, 50, 24);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.strokeRect(630, 240, 50, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('7XYZ918', 635, 256);

  // Panel highlight boundary
  ctx.strokeStyle = '#38bdf8';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(160, 180, 480, 140);
  ctx.setLineDash([]);

  // Damage Overlay (if provided)
  if (damageOverlay) {
    ctx.strokeStyle = damageOverlay.color || '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(damageOverlay.x, damageOverlay.y, damageOverlay.w, damageOverlay.h);

    // Warning marker tag
    ctx.fillStyle = damageOverlay.color || '#ef4444';
    ctx.fillRect(damageOverlay.x, damageOverlay.y - 20, damageOverlay.w + 10, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(damageOverlay.label, damageOverlay.x + 4, damageOverlay.y - 6);

    // Scratch or dent representation lines
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(damageOverlay.x + 8, damageOverlay.y + 12);
    ctx.lineTo(damageOverlay.x + damageOverlay.w - 8, damageOverlay.y + damageOverlay.h - 10);
    ctx.stroke();
  }

  // Camera HUD overlay (Simulating anti-tamper stream)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(16, 16, 320, 54);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 16, 320, 54);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`FOV: ${panelName.toUpperCase()}`, 26, 34);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${angleText} | 1080p 30fps | GPS Valid`, 26, 52);

  // Timecode badge
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(770, 30, 6, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.85);
}

// Generate Realistic Keyframes for Pickup (T0)
export function getSamplePickupFrames(): { timestamp_seconds: number; frame_index: number; dataUrl: string }[] {
  return [
    {
      timestamp_seconds: 0.5,
      frame_index: 0,
      dataUrl: createSyntheticFrame('front_bumper', 'Front Face View (Clockwise Start)', {
        label: 'Pre-existing Lower Scuff',
        x: 410,
        y: 250,
        w: 90,
        h: 40,
        color: '#f59e0b',
      }),
    },
    {
      timestamp_seconds: 2.0,
      frame_index: 1,
      dataUrl: createSyntheticFrame('driver_fender', 'Driver Front Quarter View'),
    },
    {
      timestamp_seconds: 4.5,
      frame_index: 2,
      dataUrl: createSyntheticFrame('driver_mirror', 'Driver Mirror & Glass'),
    },
    {
      timestamp_seconds: 6.5,
      frame_index: 3,
      dataUrl: createSyntheticFrame('driver_front_door', 'Driver Front Door Surface - Clean'),
    },
    {
      timestamp_seconds: 9.0,
      frame_index: 4,
      dataUrl: createSyntheticFrame('driver_rear_door', 'Driver Rear Door - Factory Clean'),
    },
    {
      timestamp_seconds: 11.5,
      frame_index: 5,
      dataUrl: createSyntheticFrame('trunk_rear_bumper', 'Rear Bumper & Plate 7XYZ918'),
    },
    {
      timestamp_seconds: 14.0,
      frame_index: 6,
      dataUrl: createSyntheticFrame('passenger_quarter_panel', 'Passenger Rear Quarter'),
    },
    {
      timestamp_seconds: 16.5,
      frame_index: 7,
      dataUrl: createSyntheticFrame('passenger_front_door', 'Passenger Front Door'),
    },
  ];
}

// Generate Realistic Keyframes for Return (T1) with New Door Dent & Scratch
export function getSampleReturnFrames(): { timestamp_seconds: number; frame_index: number; dataUrl: string }[] {
  return [
    {
      timestamp_seconds: 0.5,
      frame_index: 0,
      dataUrl: createSyntheticFrame('front_bumper', 'Front Face View (Clockwise Start)', {
        label: 'Pre-existing Lower Scuff',
        x: 410,
        y: 250,
        w: 90,
        h: 40,
        color: '#f59e0b',
      }),
    },
    {
      timestamp_seconds: 2.0,
      frame_index: 1,
      dataUrl: createSyntheticFrame('driver_fender', 'Driver Front Quarter View'),
    },
    {
      timestamp_seconds: 4.5,
      frame_index: 2,
      dataUrl: createSyntheticFrame('driver_mirror', 'Driver Mirror & Glass'),
    },
    {
      timestamp_seconds: 6.5,
      frame_index: 3,
      dataUrl: createSyntheticFrame('driver_front_door', 'Driver Front Door - Clean'),
    },
    {
      timestamp_seconds: 9.0,
      frame_index: 4,
      dataUrl: createSyntheticFrame('driver_rear_door', 'Driver Rear Door - DEEP IMPACT DENT', {
        label: 'NEW DAMAGE: 4.5in Crease & Scratch',
        x: 320,
        y: 210,
        w: 120,
        h: 60,
        color: '#ef4444',
      }),
    },
    {
      timestamp_seconds: 11.5,
      frame_index: 5,
      dataUrl: createSyntheticFrame('trunk_rear_bumper', 'Rear Bumper & Plate 7XYZ918'),
    },
    {
      timestamp_seconds: 14.0,
      frame_index: 6,
      dataUrl: createSyntheticFrame('passenger_quarter_panel', 'Passenger Rear Quarter'),
    },
    {
      timestamp_seconds: 16.5,
      frame_index: 7,
      dataUrl: createSyntheticFrame('passenger_front_door', 'Passenger Front Door'),
    },
  ];
}

// Complete preloaded sample dataset for offline / instantaneous demo
export const SAMPLE_PICKUP_SCAN: ScanRecord = {
  id: 'SCN-PICKUP-2026-9041',
  type: 'pickup',
  vehicleLabel: '2025 Tesla Model 3 Long Range (Midnight Silver)',
  vinOrPlate: 'CA 7XYZ918 (VIN: 5YJ3E1EB9PF88102)',
  timestamp: '2026-09-24T09:15:00Z',
  sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  targetPanel: 'front_bumper',
  targetDirection: 'clockwise',
  videoDurationSeconds: 18.5,
  frames: [], // Will be filled dynamically by getSamplePickupFrames()
  verification: {
    startingPanelCheck: {
      status: 'pass',
      detected: 'Front Bumper & Grille',
      target: 'front_bumper',
      reason: 'Scan initiated exactly facing the front bumper and vehicle badge as specified by protocol.',
    },
    directionCheck: {
      status: 'pass',
      detected: 'clockwise',
      target: 'clockwise',
      reason: 'Operator traversed clockwise down the driver flank towards rear bumper.',
    },
    coverageCheck: {
      status: 'pass',
      missingPanels: [],
      visiblePanels: [
        'front_bumper',
        'hood',
        'windshield',
        'driver_fender',
        'driver_front_door',
        'driver_rear_door',
        'driver_quarter_panel',
        'trunk_rear_bumper',
        'passenger_quarter_panel',
        'passenger_front_door',
        'wheel_driver_front',
        'wheel_driver_rear',
      ],
      reason: 'Full 360-degree perimeter captured including wheels, side sills, and glazing.',
    },
    authenticityCheck: {
      status: 'pass',
      isScreenReRecording: false,
      reason: 'Natural depth of field, real sunlight refraction on metallic paint, zero screen pixel grid or bezel glare.',
    },
    licensePlateCheck: {
      status: 'pass',
      plateNumber: '7XYZ918',
      reason: 'Rear California license plate 7XYZ918 clearly legible in Frame #5.',
    },
    overallTrustScore: 98,
    summary: 'Compliant pickup baseline scan. High resolution, verified motion vector challenge compliance, and authenticated timestamp.',
  },
  damages: [
    {
      id: 'DMG-PU-01',
      panel: 'front_bumper',
      panelLabel: 'Front Bumper & Grille',
      type: 'scratch_scuff',
      severity: 'minor',
      confidence: 0.94,
      timestamp_seconds: 0.5,
      frame_index: 0,
      box_2d: [520, 510, 600, 620],
      description: 'Pre-existing minor curb scuff on lower front chin splitter (< 2 inches). Clearcoat scratch without primer detachment.',
    },
  ],
};

export const SAMPLE_RETURN_SCAN: ScanRecord = {
  id: 'SCN-RETURN-2026-9812',
  type: 'return',
  vehicleLabel: '2025 Tesla Model 3 Long Range (Midnight Silver)',
  vinOrPlate: 'CA 7XYZ918 (VIN: 5YJ3E1EB9PF88102)',
  timestamp: '2026-09-27T10:45:00Z',
  sha256Hash: '4a53c07887e02df35d1f04523e1c0d453ae41f98592c3a58e819b1689b9101d2',
  targetPanel: 'front_bumper',
  targetDirection: 'clockwise',
  videoDurationSeconds: 18.5,
  frames: [], // Will be filled dynamically by getSampleReturnFrames()
  verification: {
    startingPanelCheck: {
      status: 'pass',
      detected: 'Front Bumper & Grille',
      target: 'front_bumper',
      reason: 'Scan initiated at front bumper conforming to randomized prompt token.',
    },
    directionCheck: {
      status: 'pass',
      detected: 'clockwise',
      target: 'clockwise',
      reason: 'Clockwise walkaround maintained around driver side.',
    },
    coverageCheck: {
      status: 'pass',
      missingPanels: [],
      visiblePanels: [
        'front_bumper',
        'driver_fender',
        'driver_front_door',
        'driver_rear_door',
        'trunk_rear_bumper',
        'passenger_quarter_panel',
      ],
      reason: 'Complete continuous loop successfully recorded.',
    },
    authenticityCheck: {
      status: 'pass',
      isScreenReRecording: false,
      reason: 'Authentic camera hardware feed confirmed. Consistent motion blur and physical parallax.',
    },
    licensePlateCheck: {
      status: 'pass',
      plateNumber: '7XYZ918',
      reason: 'License plate matches pickup baseline record.',
    },
    overallTrustScore: 97,
    summary: 'Verified return inspection recording. All integrity checks passed.',
  },
  damages: [
    {
      id: 'DMG-RT-01',
      panel: 'front_bumper',
      panelLabel: 'Front Bumper & Grille',
      type: 'scratch_scuff',
      severity: 'minor',
      confidence: 0.95,
      timestamp_seconds: 0.5,
      frame_index: 0,
      box_2d: [520, 510, 600, 620],
      description: 'Lower front chin splitter scuff. Matches exact shape and position of pickup baseline.',
    },
    {
      id: 'DMG-RT-02',
      panel: 'driver_rear_door',
      panelLabel: 'Driver Rear Door',
      type: 'dent_crease',
      severity: 'moderate',
      confidence: 0.96,
      timestamp_seconds: 9.0,
      frame_index: 4,
      box_2d: [430, 400, 560, 550],
      description: 'Noticeable 4.5-inch body line crease with adjacent paint scrape through clearcoat. Appears to be parking lot door strike.',
    },
  ],
};

export const SAMPLE_COMPARE_RESULT: CompareResult = {
  id: 'CMP-DEMO-T0-T1-ARBITRATION',
  pickupScanId: 'SCN-PICKUP-2026-9041',
  returnScanId: 'SCN-RETURN-2026-9812',
  vehicleLabel: '2025 Tesla Model 3 Long Range (Midnight Silver)',
  comparisonTimestamp: '2026-09-27T11:00:00Z',
  overallSummary: 'Gemini Dispute Arbitration Engine concluded 1 new damage event occurred during the rental period (Driver Rear Door crease/scrape). The front bumper scuff is conclusively verified as pre-existing at pickup.',
  totalReturnDamages: 2,
  newDamagesCount: 1,
  preExistingCount: 1,
  uncertainCount: 0,
  items: [
    {
      id: 'DIFF-01',
      returnDamageId: 'DMG-RT-01',
      panel: 'front_bumper',
      panelLabel: 'Front Bumper & Grille',
      type: 'scratch_scuff',
      severity: 'minor',
      returnDamageDescription: 'Lower chin scuff on front fascia.',
      returnTimestampSeconds: 0.5,
      returnBox2d: [520, 510, 600, 620],
      verdict: 'pre_existing',
      confidence: 0.97,
      reasoning: 'Present with identical geometry, orientation, and clearcoat degradation in Pickup baseline frame #0 at 0.5s. Consumer is not liable.',
      pickupMatchedFrameIndex: 0,
      pickupMatchedTimestampSeconds: 0.5,
      pickupEvidenceObservation: 'Visible in baseline Pickup frame #0: Scuff present at coordinate [520, 510, 600, 620].',
    },
    {
      id: 'DIFF-02',
      returnDamageId: 'DMG-RT-02',
      panel: 'driver_rear_door',
      panelLabel: 'Driver Rear Door',
      type: 'dent_crease',
      severity: 'moderate',
      returnDamageDescription: '4.5-inch body crease and paint scratch.',
      returnTimestampSeconds: 9.0,
      returnBox2d: [430, 400, 560, 550],
      verdict: 'new_since_pickup',
      confidence: 0.94,
      reasoning: 'Driver rear door was fully inspected under clear lighting in Pickup baseline frame #4 at 9.0s and showed pristine, uninterrupted reflection lines with zero deformation. Return scan at 9.0s reveals definitive body indentation.',
      pickupMatchedFrameIndex: 4,
      pickupMatchedTimestampSeconds: 9.0,
      pickupEvidenceObservation: 'Pickup frame #4 at 9.0s proves door was smooth and undamaged upon rental departure.',
    },
  ],
};
