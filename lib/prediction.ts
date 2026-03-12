import * as ort from "onnxruntime-web";

// ---------------------------------------------------------------------------
// ONNX Model Session
// ---------------------------------------------------------------------------

let session: ort.InferenceSession | null = null;

export async function loadModel(): Promise<void> {
  if (session) return;
  session = await ort.InferenceSession.create("/models/race-predictor.onnx");
}

export function isModelLoaded(): boolean {
  return session !== null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PredictionInput {
  gridPosition: number;
  constructorStrength: number;
  driverForm: number;
  circuitType: number;
  isWet: number;
  driverCircuitHistory: number;
  teammateQualiGap: number;
}

export interface PredictionOutput {
  driverId: string;
  driverName: string;
  teamId: string;
  predictedPosition: number;
  winProbability: number;
  podiumProbability: number;
  pointsProbability: number;
}

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

/**
 * Runs the ONNX model with the given feature inputs and returns raw predicted
 * positions. If the model is not loaded, falls back to the heuristic engine.
 */
export async function predict(inputs: PredictionInput[]): Promise<number[]> {
  if (!session) {
    // Fallback: use heuristic scoring when no ONNX model is available
    return inputs.map((inp) => heuristicScore(inp));
  }

  const featureCount = 7;
  const flatFeatures = new Float32Array(inputs.length * featureCount);

  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i];
    const offset = i * featureCount;
    flatFeatures[offset] = inp.gridPosition;
    flatFeatures[offset + 1] = inp.constructorStrength;
    flatFeatures[offset + 2] = inp.driverForm;
    flatFeatures[offset + 3] = inp.circuitType;
    flatFeatures[offset + 4] = inp.isWet;
    flatFeatures[offset + 5] = inp.driverCircuitHistory;
    flatFeatures[offset + 6] = inp.teammateQualiGap;
  }

  const tensor = new ort.Tensor("float32", flatFeatures, [
    inputs.length,
    featureCount,
  ]);
  const results = await session.run({ input: tensor });
  const outputKey = Object.keys(results)[0];
  const output = results[outputKey];
  return Array.from(output.data as Float32Array);
}

// ---------------------------------------------------------------------------
// Monte Carlo probability estimation
// ---------------------------------------------------------------------------

/**
 * Runs a mini Monte Carlo simulation with small perturbations to estimate
 * win, podium, and points-finish probabilities for each driver.
 */
export async function predictWithProbabilities(
  inputs: PredictionInput[],
  iterations: number = 100
): Promise<
  {
    predictedPosition: number;
    winProbability: number;
    podiumProbability: number;
    pointsProbability: number;
  }[]
> {
  const driverCount = inputs.length;
  const winCounts = new Array(driverCount).fill(0);
  const podiumCounts = new Array(driverCount).fill(0);
  const pointsCounts = new Array(driverCount).fill(0);
  const positionSums = new Array(driverCount).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    // Add small noise to inputs for each iteration
    const perturbedInputs = inputs.map((inp) => ({
      ...inp,
      driverForm: inp.driverForm + (Math.random() - 0.5) * 0.4,
      constructorStrength:
        inp.constructorStrength + (Math.random() - 0.5) * 0.2,
      teammateQualiGap: inp.teammateQualiGap + (Math.random() - 0.5) * 0.1,
      isWet: inp.isWet, // Keep wet/dry consistent
    }));

    const rawScores = await predict(perturbedInputs);

    // Rank by raw scores (lower is better)
    const indexed = rawScores.map((score, i) => ({ score, index: i }));
    indexed.sort((a, b) => a.score - b.score);

    indexed.forEach((entry, rank) => {
      const pos = rank + 1;
      positionSums[entry.index] += pos;
      if (pos === 1) winCounts[entry.index]++;
      if (pos <= 3) podiumCounts[entry.index]++;
      if (pos <= 10) pointsCounts[entry.index]++;
    });
  }

  return inputs.map((_, i) => ({
    predictedPosition: Math.round(positionSums[i] / iterations),
    winProbability: Math.round((winCounts[i] / iterations) * 100),
    podiumProbability: Math.round((podiumCounts[i] / iterations) * 100),
    pointsProbability: Math.round((pointsCounts[i] / iterations) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Heuristic fallback (when no ONNX model is present)
// ---------------------------------------------------------------------------

/**
 * Computes a heuristic predicted position score based on input features.
 * Lower score = better predicted finish. This provides a reasonable
 * prediction engine even without a trained ONNX model.
 */
function heuristicScore(inp: PredictionInput): number {
  // Grid position is the strongest predictor (weight: 0.40)
  const gridFactor = inp.gridPosition * 0.40;

  // Constructor strength inverted (10 = strongest, so lower score = better)
  // Normalize: stronger constructor = lower score
  const constructorFactor = (10 - inp.constructorStrength) * 0.25;

  // Driver form: higher = better recent results, inverted for score
  const formFactor = (10 - inp.driverForm) * 0.15;

  // Circuit history: higher = better at this circuit
  const circuitFactor = (10 - inp.driverCircuitHistory) * 0.10;

  // Wet weather adds randomness
  const wetPenalty = inp.isWet ? (Math.random() - 0.3) * 2 : 0;

  // Teammate gap: positive means slower than teammate
  const teammateFactor = inp.teammateQualiGap * 0.10;

  return gridFactor + constructorFactor + formFactor + circuitFactor + wetPenalty + teammateFactor;
}
