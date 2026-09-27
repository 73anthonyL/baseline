import { ScanRecord, CompareResult, VideoFrame } from './types';
import chryslerFrontClean from './assets/images/chrysler_front_clean_1790539925970.jpg';
import chryslerSideClean from './assets/images/chrysler_side_clean_1790539937330.jpg';
import chryslerSideDent from './assets/images/chrysler_side_dent_1790539947678.jpg';
import chryslerRearClean from './assets/images/chrysler_rear_clean_1790539957874.jpg';
import chryslerRearDent from './assets/images/chrysler_rear_dent_1790539968144.jpg';
import chryslerDriverSide from './assets/images/chrysler_driver_side_1790539980039.jpg';

// High-resolution automotive inspection photography matching the exact user demo vehicle:
// 2008 Chrysler 300 Sedan (California License Plate: 5LRT081)
export const REAL_CAR_PHOTOS = {
  chrysler_front: chryslerFrontClean,
  chrysler_passenger_clean: chryslerSideClean,
  chrysler_passenger_dent: chryslerSideDent,
  chrysler_rear_clean: chryslerRearClean,
  chrysler_rear_dent: chryslerRearDent,
  chrysler_driver: chryslerDriverSide,
  porsche: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  bmw_x5: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
  rivian: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
};

// Generate Real Video Keyframes for Pickup Baseline (T0) - Pristine Doors & Bumper
export function getSamplePickupFrames(): VideoFrame[] {
  return [
    {
      timestamp_seconds: 0.5,
      frame_index: 0,
      dataUrl: REAL_CAR_PHOTOS.chrysler_front,
    },
    {
      timestamp_seconds: 3.5,
      frame_index: 1,
      dataUrl: REAL_CAR_PHOTOS.chrysler_passenger_clean,
    },
    {
      timestamp_seconds: 7.0,
      frame_index: 2,
      dataUrl: REAL_CAR_PHOTOS.chrysler_rear_clean,
    },
    {
      timestamp_seconds: 10.5,
      frame_index: 3,
      dataUrl: REAL_CAR_PHOTOS.chrysler_driver,
    },
    {
      timestamp_seconds: 13.0,
      frame_index: 4,
      dataUrl: REAL_CAR_PHOTOS.chrysler_front,
    },
  ];
}

// Generate Real Video Keyframes for Return Audit (T1) - Fresh Collision Door Crease & Bumper Scrape
export function getSampleReturnFrames(): VideoFrame[] {
  return [
    {
      timestamp_seconds: 0.5,
      frame_index: 0,
      dataUrl: REAL_CAR_PHOTOS.chrysler_front,
    },
    {
      timestamp_seconds: 3.5,
      frame_index: 1,
      dataUrl: REAL_CAR_PHOTOS.chrysler_passenger_dent,
    },
    {
      timestamp_seconds: 7.0,
      frame_index: 2,
      dataUrl: REAL_CAR_PHOTOS.chrysler_rear_dent,
    },
    {
      timestamp_seconds: 10.5,
      frame_index: 3,
      dataUrl: REAL_CAR_PHOTOS.chrysler_driver,
    },
    {
      timestamp_seconds: 13.0,
      frame_index: 4,
      dataUrl: REAL_CAR_PHOTOS.chrysler_front,
    },
  ];
}

export const SAMPLE_PICKUP_SCAN: ScanRecord = {
  id: 'SCN-PICKUP-2026-3001',
  type: 'pickup',
  vehicleLabel: '2008 Chrysler 300 Touring Sedan',
  vinOrPlate: 'CA 5LRT081',
  timestamp: '2026-09-24T09:15:00Z',
  sha256Hash: '9a31b4021efcd48100ef90a187381023a8bc1298410294821a837498cda90214',
  targetPanel: 'front_bumper',
  targetDirection: 'counter-clockwise',
  videoDurationSeconds: 14.0,
  frames: getSamplePickupFrames(),
  verification: {
    startingPanelCheck: {
      status: 'pass',
      detected: 'Front Bumper & Grille',
      target: 'front_bumper',
      reason: 'Scan initiated facing front chrome mesh grille and California plate 5LRT081.',
    },
    directionCheck: {
      status: 'pass',
      detected: 'counter-clockwise',
      target: 'counter-clockwise',
      reason: 'Smooth counter-clockwise orbit starting down passenger flank.',
    },
    coverageCheck: {
      status: 'pass',
      missingPanels: [],
      visiblePanels: ['front_bumper', 'hood', 'passenger_fender', 'passenger_front_door', 'passenger_rear_door', 'trunk_rear_bumper', 'driver_rear_door', 'driver_front_door'],
      reason: 'Complete 360 perimeter walkaround recorded and verified.',
    },
    authenticityCheck: {
      status: 'pass',
      isScreenReRecording: false,
      reason: 'Genuine optical parallax, direct ambient outdoor sunlight.',
    },
    licensePlateCheck: {
      status: 'pass',
      plateNumber: '5LRT081',
      reason: 'California plate 5LRT081 verified on front and rear bumper.',
    },
    overallTrustScore: 99,
    summary: 'Compliant pickup baseline. 360 perimeter verified with zero structural damage.',
  },
  damages: [
    {
      id: 'DMG-PU-01',
      panel: 'hood',
      panelLabel: 'Hood & Front Cowl',
      type: 'paint_chip',
      severity: 'minor',
      confidence: 0.93,
      timestamp_seconds: 0.5,
      frame_index: 0,
      box_2d: [380, 420, 520, 600],
      description: 'Pre-existing clearcoat sun oxidation on central hood ridge.',
    },
  ],
};

export const SAMPLE_RETURN_SCAN: ScanRecord = {
  id: 'SCN-RETURN-2026-3088',
  type: 'return',
  vehicleLabel: '2008 Chrysler 300 Touring Sedan',
  vinOrPlate: 'CA 5LRT081',
  timestamp: '2026-09-27T10:45:00Z',
  sha256Hash: 'c748201fa8130985ad9082bc7190820491823908471209384091823098501239',
  targetPanel: 'front_bumper',
  targetDirection: 'counter-clockwise',
  videoDurationSeconds: 14.0,
  frames: getSampleReturnFrames(),
  verification: {
    startingPanelCheck: {
      status: 'pass',
      detected: 'Front Bumper & Grille',
      target: 'front_bumper',
      reason: 'Scan initiated at front bumper conforming to randomized challenge token.',
    },
    directionCheck: {
      status: 'pass',
      detected: 'counter-clockwise',
      target: 'counter-clockwise',
      reason: 'Counter-clockwise walkaround rotation verified.',
    },
    coverageCheck: {
      status: 'pass',
      missingPanels: [],
      visiblePanels: ['front_bumper', 'hood', 'passenger_fender', 'passenger_front_door', 'passenger_rear_door', 'trunk_rear_bumper', 'driver_rear_door', 'driver_front_door'],
      reason: 'Full 360-degree loop completed.',
    },
    authenticityCheck: {
      status: 'pass',
      isScreenReRecording: false,
      reason: 'Authentic camera video with natural sunlight, motion blur, and ambient pavement depth.',
    },
    licensePlateCheck: {
      status: 'pass',
      plateNumber: '5LRT081',
      reason: 'California plate 5LRT081 verified on rear bumper in frame #2.',
    },
    overallTrustScore: 97,
    summary: 'Return audit completed. 2 new structural collision damages detected on passenger front door and rear bumper.',
  },
  damages: [
    {
      id: 'DMG-RET-01',
      panel: 'hood',
      panelLabel: 'Hood & Front Cowl',
      type: 'paint_chip',
      severity: 'minor',
      confidence: 0.94,
      timestamp_seconds: 0.5,
      frame_index: 0,
      box_2d: [380, 420, 520, 600],
      description: 'Pre-existing clearcoat oxidation on central hood ridge.',
    },
    {
      id: 'DMG-RET-02',
      panel: 'passenger_front_door',
      panelLabel: 'Passenger Front Door',
      type: 'dent_crease',
      severity: 'moderate',
      confidence: 0.97,
      timestamp_seconds: 3.5,
      frame_index: 1,
      box_2d: [390, 410, 570, 680],
      description: '6.2-inch horizontal door crease with deep paint scrape above the chrome molding strip.',
    },
    {
      id: 'DMG-RET-03',
      panel: 'trunk_rear_bumper',
      panelLabel: 'Trunk & Rear Bumper',
      type: 'scratch_scuff',
      severity: 'moderate',
      confidence: 0.95,
      timestamp_seconds: 7.0,
      frame_index: 2,
      box_2d: [580, 620, 780, 840],
      description: 'Rear bumper corner impact scrape with paint transfer below right taillight.',
    },
  ],
};

export const SAMPLE_COMPARE_RESULT: CompareResult = {
  id: 'CMP-2026-3008',
  pickupScanId: 'SCN-PICKUP-2026-3001',
  returnScanId: 'SCN-RETURN-2026-3088',
  vehicleLabel: '2008 Chrysler 300 Touring Sedan',
  comparisonTimestamp: '2026-09-27T10:48:32Z',
  overallSummary: 'Arbitration completed against baseline SCN-PICKUP-2026-3001. 1 pre-existing oxidation patch verified on hood. 2 new damages detected: 1 impact crease on passenger front door and 1 collision scrape on rear bumper.',
  totalReturnDamages: 3,
  newDamagesCount: 2,
  preExistingCount: 1,
  uncertainCount: 0,
  items: [
    {
      id: 'DIFF-01',
      returnDamageId: 'DMG-RET-01',
      panel: 'hood',
      panelLabel: 'Hood & Front Cowl',
      type: 'paint_chip',
      severity: 'minor',
      returnDamageDescription: 'Clearcoat sun oxidation on central hood ridge.',
      returnTimestampSeconds: 0.5,
      returnBox2d: [380, 420, 520, 600],
      verdict: 'pre_existing',
      confidence: 0.96,
      reasoning: 'Matches identical clearcoat oxidation visible in Pickup Scan Frame #0 (0.5s). Driver is not liable.',
      pickupMatchedFrameIndex: 0,
      pickupMatchedTimestampSeconds: 0.5,
      pickupEvidenceObservation: 'Confirmed present at vehicle checkout.',
    },
    {
      id: 'DIFF-02',
      returnDamageId: 'DMG-RET-02',
      panel: 'passenger_front_door',
      panelLabel: 'Passenger Front Door',
      type: 'dent_crease',
      severity: 'moderate',
      returnDamageDescription: '6.2-inch horizontal door crease with paint scrape above chrome molding.',
      returnTimestampSeconds: 3.5,
      returnBox2d: [390, 410, 570, 680],
      verdict: 'new_since_pickup',
      confidence: 0.98,
      reasoning: 'In Pickup Baseline Frame #1 (3.5s), the passenger front door was completely smooth with clean reflection across the chrome strip. Collision crease is new.',
      pickupMatchedFrameIndex: 1,
      pickupMatchedTimestampSeconds: 3.5,
      pickupEvidenceObservation: 'Passenger door was completely undamaged at pickup.',
    },
    {
      id: 'DIFF-03',
      returnDamageId: 'DMG-RET-03',
      panel: 'trunk_rear_bumper',
      panelLabel: 'Trunk & Rear Bumper',
      type: 'scratch_scuff',
      severity: 'moderate',
      returnDamageDescription: 'Rear bumper corner scrape with paint transfer below right taillight.',
      returnTimestampSeconds: 7.0,
      returnBox2d: [580, 620, 780, 840],
      verdict: 'new_since_pickup',
      confidence: 0.97,
      reasoning: 'In Pickup Baseline Frame #2 (7.0s), the rear bumper corner below the right taillight is intact and unscuffed. Damage occurred during rental.',
      pickupMatchedFrameIndex: 2,
      pickupMatchedTimestampSeconds: 7.0,
      pickupEvidenceObservation: 'Rear bumper was pristine at pickup.',
    },
  ],
};
