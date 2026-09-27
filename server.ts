import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High body limit to handle base64 vehicle keyframe arrays safely without failing silently
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Google GenAI initialization with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Single scan analysis endpoint
app.post('/api/analyze-scan', async (req, res) => {
  try {
    const { targetPanel, targetDirection, frames, vehicleLabel, vinOrPlate } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'No video frames provided for analysis.' });
    }

    console.log(`[GroundTruth Server] Analyzing scan with ${frames.length} frames for target panel: ${targetPanel}, direction: ${targetDirection}`);

    // Downsample if over 30 frames to guarantee safe payload and high speed
    const selectedFrames = frames.length > 30 
      ? frames.filter((_, idx) => idx % Math.ceil(frames.length / 30) === 0).slice(0, 30)
      : frames;

    // Convert keyframes into GoogleGenAI content parts
    const frameParts: any[] = [];
    selectedFrames.forEach((frame: { timestamp_seconds: number; frame_index: number; dataUrl: string }, i: number) => {
      const base64Data = frame.dataUrl.includes('base64,')
        ? frame.dataUrl.split('base64,')[1]
        : frame.dataUrl;

      frameParts.push({
        text: `Frame index #${frame.frame_index ?? i} (timestamp: ${frame.timestamp_seconds?.toFixed(1) ?? i}s):`
      });
      frameParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        }
      });
    });

    const systemPrompt = `You are GroundTruth Auto's certified forensic vehicle inspection AI.
You are inspecting an ordered sequence of extracted frames from a single continuous vehicle walkaround scan.

CRITICAL INSTRUCTIONS & CHECKS:
1. STARTING PANEL & DIRECTION CHECK:
   - Target start panel was: "${targetPanel}".
   - Target walkaround direction was: "${targetDirection}".
   - Observe the initial frames: which panel is shown first? Is the operator moving clockwise or counter-clockwise around the vehicle?
   - Assign status: "pass", "fail", or "unclear" with a concise forensic explanation.

2. COMPLETE COVERAGE CHECK:
   - Check if all 4 vehicle sides (Front, Driver side, Rear, Passenger side) and all 4 wheels/rims are visible in at least one frame.
   - List any missing or obscured panels (e.g., missed passenger rear quarter, or obscured wheels). Status: "pass" (all covered), "fail" (major missing sides), or "unclear".

3. AUTHENTICITY & SCREEN RE-RECORDING CHECK:
   - Check if this is a genuine real-world physical vehicle walkaround or if the user is re-recording a computer/tablet monitor (look for moire patterns, screen bezels, screen glare, pixel grid).
   - isScreenReRecording: boolean. Status: "pass" (genuine camera walkaround), "fail" (re-recorded screen detected), or "unclear".

4. LICENSE PLATE CHECK:
   - Look for the vehicle's front or rear license plate. If readable, extract the characters into plateNumber. Status: "pass" (plate clearly visible and matches expectation or valid format), "fail", or "unclear".

5. EXTERIOR DAMAGE DETECTION & LOCALIZATION:
   - Inspect every exterior panel thoroughly:
     - Scratches, paint scuffs, scrapes
     - Dents, dings, creases
     - Paint chips, stone chips
     - Glass cracks, star chips on windshield or lamps
     - Punctures, bumper tears, loose trim
   - Allowed panels: 'front_bumper', 'hood', 'windshield', 'roof', 'driver_fender', 'driver_mirror', 'driver_front_door', 'driver_rear_door', 'driver_quarter_panel', 'passenger_fender', 'passenger_mirror', 'passenger_front_door', 'passenger_rear_door', 'passenger_quarter_panel', 'trunk_rear_bumper', 'wheel_driver_front', 'wheel_driver_rear', 'wheel_passenger_front', 'wheel_passenger_rear'.
   - Allowed damage types: 'scratch_scuff', 'dent_crease', 'paint_chip', 'crack_glass', 'puncture_tear'.
   - Allowed severity: 'minor', 'moderate', 'severe'.
   - Provide normalized bounding box coordinates [ymin, xmin, ymax, xmax] on a scale of 0 to 1000 for the exact frame where the damage is clearest.
   - Assign realistic confidence (0.0 to 1.0).

6. OVERALL TRUST SCORE:
   - Compute an integer score between 0 and 100 based on challenge adherence, coverage completeness, video clarity, and authenticity.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { text: systemPrompt },
        ...frameParts,
        { text: 'Provide the structured verification report and detected damage list strictly according to the requested JSON schema.' }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verification: {
              type: Type.OBJECT,
              properties: {
                startingPanelCheck: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    detected: { type: Type.STRING },
                    target: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['status', 'detected', 'target', 'reason'],
                },
                directionCheck: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    detected: { type: Type.STRING },
                    target: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['status', 'detected', 'target', 'reason'],
                },
                coverageCheck: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    missingPanels: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    visiblePanels: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    reason: { type: Type.STRING },
                  },
                  required: ['status', 'missingPanels', 'visiblePanels', 'reason'],
                },
                authenticityCheck: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    isScreenReRecording: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                  },
                  required: ['status', 'isScreenReRecording', 'reason'],
                },
                licensePlateCheck: {
                  type: Type.OBJECT,
                  properties: {
                    status: { type: Type.STRING },
                    plateNumber: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['status', 'reason'],
                },
                overallTrustScore: { type: Type.INTEGER },
                summary: { type: Type.STRING },
              },
              required: [
                'startingPanelCheck',
                'directionCheck',
                'coverageCheck',
                'authenticityCheck',
                'licensePlateCheck',
                'overallTrustScore',
                'summary',
              ],
            },
            damages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  panel: { type: Type.STRING },
                  panelLabel: { type: Type.STRING },
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  timestamp_seconds: { type: Type.NUMBER },
                  frame_index: { type: Type.INTEGER },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] scaled 0 to 1000',
                  },
                  description: { type: Type.STRING },
                },
                required: [
                  'panel',
                  'type',
                  'severity',
                  'confidence',
                  'timestamp_seconds',
                  'frame_index',
                  'box_2d',
                  'description',
                ],
              },
            },
          },
          required: ['verification', 'damages'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('[GroundTruth Server] analyze-scan failed:', error);
    return res.status(500).json({
      error: 'Failed to analyze vehicle scan with Gemini.',
      details: error?.message || String(error),
    });
  }
});

// Dispute Arbitration / Comparison Endpoint
app.post('/api/compare-scans', async (req, res) => {
  try {
    const { pickupScan, returnScan } = req.body;

    if (!pickupScan || !returnScan) {
      return res.status(400).json({ error: 'Both pickupScan and returnScan are required.' });
    }

    console.log(`[GroundTruth Server] Comparing Pickup Scan (${pickupScan.id}) with Return Scan (${returnScan.id})`);

    // Prepare sampled keyframe parts for both scans (12 max each to avoid hitting token/payload ceilings)
    const selectKeyFrames = (frames: any[], count = 10) => {
      if (!frames || frames.length === 0) return [];
      const step = Math.max(1, Math.floor(frames.length / count));
      return frames.filter((_, idx) => idx % step === 0).slice(0, count);
    };

    const sampledPickup = selectKeyFrames(pickupScan.frames, 10);
    const sampledReturn = selectKeyFrames(returnScan.frames, 10);

    const promptParts: any[] = [];

    promptParts.push({
      text: `DISPUTE ARBITRATION COMPARISON:
VEHICLE: ${pickupScan.vehicleLabel || 'Vehicle'} (Plate: ${pickupScan.vinOrPlate || 'N/A'})

PICKUP SCAN METADATA:
ID: ${pickupScan.id}
Timestamp: ${pickupScan.timestamp}
SHA-256: ${pickupScan.sha256Hash}
Existing pickup damage count: ${pickupScan.damages?.length || 0}
Known pickup damages: ${JSON.stringify(pickupScan.damages?.map((d: any) => ({ panel: d.panel, type: d.type, desc: d.description, sec: d.timestamp_seconds })) || [])}

RETURN SCAN METADATA:
ID: ${returnScan.id}
Timestamp: ${returnScan.timestamp}
SHA-256: ${returnScan.sha256Hash}
Return damage count detected: ${returnScan.damages?.length || 0}
Return damages to arbitrate: ${JSON.stringify(returnScan.damages?.map((d: any) => ({ id: d.id, panel: d.panel, type: d.type, severity: d.severity, desc: d.description, sec: d.timestamp_seconds, frame_index: d.frame_index, box_2d: d.box_2d })) || [])}

Now examining visual evidence from Pickup scan frames:`
    });

    sampledPickup.forEach((frame: any, i: number) => {
      const b64 = frame.dataUrl.includes('base64,') ? frame.dataUrl.split('base64,')[1] : frame.dataUrl;
      promptParts.push({ text: `Pickup Frame #${frame.frame_index ?? i} at ${frame.timestamp_seconds?.toFixed(1) ?? i}s:` });
      promptParts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
    });

    promptParts.push({ text: `Now examining visual evidence from Return scan frames:` });

    sampledReturn.forEach((frame: any, i: number) => {
      const b64 = frame.dataUrl.includes('base64,') ? frame.dataUrl.split('base64,')[1] : frame.dataUrl;
      promptParts.push({ text: `Return Frame #${frame.frame_index ?? i} at ${frame.timestamp_seconds?.toFixed(1) ?? i}s:` });
      promptParts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
    });

    promptParts.push({
      text: `SYSTEM INSTRUCTIONS FOR ARBITRATION:
For every damage item reported in the Return Scan:
1. Identify the corresponding panel frames in the Pickup Scan.
2. Determine verdict:
   - "new_since_pickup": Clearly absent or undamaged in the pickup scan at that panel location, and clearly damaged in the return scan.
   - "pre_existing": Evident in the pickup scan (visible in pickup keyframes or listed in pickup damage report).
   - "uncertain": The panel was poorly lit, in heavy glare or shadow, blurry, obscured by water/dirt, or confidence is under 0.60.
3. CONSERVATIVE PRINCIPLE: When in doubt, prefer "uncertain" over "new_since_pickup" to prevent unfair false claims. Do NOT estimate repair cost or complexity.
4. Output structured JSON matching the requested schema.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptParts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSummary: { type: Type.STRING },
            totalReturnDamages: { type: Type.INTEGER },
            newDamagesCount: { type: Type.INTEGER },
            preExistingCount: { type: Type.INTEGER },
            uncertainCount: { type: Type.INTEGER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  returnDamageId: { type: Type.STRING },
                  panel: { type: Type.STRING },
                  panelLabel: { type: Type.STRING },
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  returnDamageDescription: { type: Type.STRING },
                  returnTimestampSeconds: { type: Type.NUMBER },
                  returnBox2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                  },
                  verdict: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  pickupEvidenceObservation: { type: Type.STRING },
                },
                required: [
                  'returnDamageId',
                  'panel',
                  'panelLabel',
                  'type',
                  'severity',
                  'returnDamageDescription',
                  'verdict',
                  'confidence',
                  'reasoning',
                ],
              },
            },
          },
          required: [
            'overallSummary',
            'totalReturnDamages',
            'newDamagesCount',
            'preExistingCount',
            'uncertainCount',
            'items',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      id: `CMP-${Date.now().toString(36).toUpperCase()}`,
      pickupScanId: pickupScan.id,
      returnScanId: returnScan.id,
      vehicleLabel: pickupScan.vehicleLabel,
      comparisonTimestamp: new Date().toISOString(),
      ...parsed,
    });
  } catch (error: any) {
    console.error('[GroundTruth Server] compare-scans failed:', error);
    return res.status(500).json({
      error: 'Failed to compare vehicle scans with Gemini.',
      details: error?.message || String(error),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GroundTruth Auto Arbitration Engine',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In development mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve static dist assets
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GroundTruth Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
