export type Direction = 'clockwise' | 'counter-clockwise';

export type Panel =
  | 'front_bumper'
  | 'hood'
  | 'windshield'
  | 'roof'
  | 'driver_fender'
  | 'driver_mirror'
  | 'driver_front_door'
  | 'driver_rear_door'
  | 'driver_quarter_panel'
  | 'passenger_fender'
  | 'passenger_mirror'
  | 'passenger_front_door'
  | 'passenger_rear_door'
  | 'passenger_quarter_panel'
  | 'trunk_rear_bumper'
  | 'wheel_driver_front'
  | 'wheel_driver_rear'
  | 'wheel_passenger_front'
  | 'wheel_passenger_rear';

export const PANEL_LABELS: Record<Panel, string> = {
  front_bumper: 'Front Bumper & Grille',
  hood: 'Hood & Front Cowl',
  windshield: 'Front Windshield',
  roof: 'Roof & Sunroof',
  driver_fender: 'Driver Front Fender',
  driver_mirror: 'Driver Side Mirror',
  driver_front_door: 'Driver Front Door',
  driver_rear_door: 'Driver Rear Door',
  driver_quarter_panel: 'Driver Rear Quarter Panel',
  passenger_fender: 'Passenger Front Fender',
  passenger_mirror: 'Passenger Side Mirror',
  passenger_front_door: 'Passenger Front Door',
  passenger_rear_door: 'Passenger Rear Door',
  passenger_quarter_panel: 'Passenger Rear Quarter Panel',
  trunk_rear_bumper: 'Trunk & Rear Bumper',
  wheel_driver_front: 'Driver Front Wheel & Rim',
  wheel_driver_rear: 'Driver Rear Wheel & Rim',
  wheel_passenger_front: 'Passenger Front Wheel & Rim',
  wheel_passenger_rear: 'Passenger Rear Wheel & Rim',
};

export type DamageType =
  | 'scratch_scuff'
  | 'dent_crease'
  | 'paint_chip'
  | 'crack_glass'
  | 'puncture_tear';

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  scratch_scuff: 'Scratch / Paint Scuff',
  dent_crease: 'Dent / Body Crease',
  paint_chip: 'Paint Chip / Clearcoat Flake',
  crack_glass: 'Glass Crack / Star Chip',
  puncture_tear: 'Puncture / Material Tear',
};

export type Severity = 'minor' | 'moderate' | 'severe';

export type CheckStatus = 'pass' | 'fail' | 'unclear';

export interface VerificationCheckItem {
  status: CheckStatus;
  reason: string;
  details?: string;
}

export interface VerificationResult {
  startingPanelCheck: VerificationCheckItem & {
    detected: string;
    target: string;
  };
  directionCheck: VerificationCheckItem & {
    detected: string;
    target: string;
  };
  coverageCheck: VerificationCheckItem & {
    missingPanels: string[];
    visiblePanels: string[];
  };
  authenticityCheck: VerificationCheckItem & {
    isScreenReRecording: boolean;
  };
  licensePlateCheck: VerificationCheckItem & {
    plateNumber?: string;
  };
  overallTrustScore: number; // 0 - 100
  summary: string;
}

export interface DamageItem {
  id: string;
  panel: Panel;
  panelLabel: string;
  type: DamageType;
  severity: Severity;
  confidence: number;
  timestamp_seconds: number;
  frame_index: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0..1000 normalized
  description: string;
}

export interface VideoFrame {
  timestamp_seconds: number;
  frame_index: number;
  dataUrl: string; // base64 JPEG resized
}

export interface VehicleSpecs {
  year: number;
  make: string;
  model: string;
  trim: string;
  category: 'Sedan' | 'SUV' | 'EV / Tech' | 'Sports' | 'Truck';
  odometerMiles: number;
  fuelOrBattery: string;
  rentalDailyRate: number;
  locationCity: string;
  fleetProvider: string;
  conditionGrade: 'Pristine A+' | 'Verified Grade A' | 'Flagged Disputed' | 'Inspection Required';
}

export interface ScanRecord {
  id: string;
  type: 'pickup' | 'return';
  vehicleLabel: string;
  vinOrPlate: string;
  timestamp: string;
  sha256Hash: string;
  targetPanel: Panel;
  targetDirection: Direction;
  videoDurationSeconds: number;
  videoUrl?: string; // object URL or preloaded URL for playback
  frames: VideoFrame[];
  verification: VerificationResult;
  damages: DamageItem[];
  specs?: VehicleSpecs;
}

export type Verdict = 'new_since_pickup' | 'pre_existing' | 'uncertain';

export interface DamageDiffItem {
  id: string;
  returnDamageId: string;
  panel: Panel;
  panelLabel: string;
  type: DamageType;
  severity: Severity;
  returnDamageDescription: string;
  returnTimestampSeconds: number;
  returnBox2d: [number, number, number, number];
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  pickupMatchedFrameIndex?: number;
  pickupMatchedTimestampSeconds?: number;
  pickupEvidenceObservation?: string;
}

export interface CompareResult {
  id: string;
  pickupScanId: string;
  returnScanId: string;
  vehicleLabel: string;
  comparisonTimestamp: string;
  overallSummary: string;
  totalReturnDamages: number;
  newDamagesCount: number;
  preExistingCount: number;
  uncertainCount: number;
  items: DamageDiffItem[];
}
