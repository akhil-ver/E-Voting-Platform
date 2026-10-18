package com.sovereign.democracy.ai.anomaly;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Generates synthetic operational data for training and evaluating the Isolation Forest model.
 * Clearly labeled as synthetic demonstration data representing civic election telemetry.
 */
public class SyntheticElectionDataGenerator {

    public static class LabeledSample {
        private final double[] features;
        private final boolean isAnomaly;
        private final String scenario;

        public LabeledSample(double[] features, boolean isAnomaly, String scenario) {
            this.features = features;
            this.isAnomaly = isAnomaly;
            this.scenario = scenario;
        }

        public double[] getFeatures() { return features; }
        public boolean isAnomaly() { return isAnomaly; }
        public String getScenario() { return scenario; }
    }

    /**
     * Generates a balanced benchmark dataset with normal operational patterns and anomaly injection.
     *
     * @param normalCount Number of normal samples (e.g. 500)
     * @param anomalyCount Number of anomaly samples (e.g. 50)
     * @param seed Random seed for strict reproducibility
     */
    public static List<LabeledSample> generateBenchmarkDataset(int normalCount, int anomalyCount, long seed) {
        Random rng = new Random(seed);
        List<LabeledSample> dataset = new ArrayList<>();

        // 1. Normal Operations: standard urban polling pattern
        for (int i = 0; i < normalCount; i++) {
            double speed = Math.max(0.1, 0.8 + rng.nextGaussian() * 0.4); // 0.2 - 2.0 ballots/min
            double failed = rng.nextDouble() < 0.9 ? 0.0 : 1.0;
            double dup = 0.0;
            double authFail = rng.nextDouble() < 0.85 ? 0.0 : (rng.nextInt(2) + 1);
            double pendingTx = rng.nextDouble() < 0.7 ? 0.0 : (rng.nextInt(3) + 1);
            double latency = Math.max(1.0, 4.0 + rng.nextGaussian() * 2.0); // 2 - 8 seconds
            double baselineDiff = Math.abs(rng.nextGaussian() * 0.3);

            double[] f = new double[] { speed, failed, dup, authFail, pendingTx, latency, baselineDiff };
            dataset.add(new LabeledSample(f, false, "NORMAL_STEADY_STATE"));
        }

        // 2. Anomaly Injections
        int perScenario = Math.max(1, anomalyCount / 4);

        // Scenario A: Vote Flooding / Bot Influx (Surge in submission rate)
        for (int i = 0; i < perScenario; i++) {
            double speed = 15.0 + rng.nextDouble() * 25.0; // 15 - 40 ballots/min
            double failed = rng.nextInt(5);
            double dup = rng.nextInt(3);
            double authFail = rng.nextInt(3);
            double pendingTx = 4.0 + rng.nextInt(8);
            double latency = 12.0 + rng.nextDouble() * 20.0;
            double baselineDiff = speed - 1.0;

            double[] f = new double[] { speed, failed, dup, authFail, pendingTx, latency, baselineDiff };
            dataset.add(new LabeledSample(f, true, "VOTE_FLOODING_SPIKE"));
        }

        // Scenario B: Credential Stuffing / Brute-Force Auth Attack
        for (int i = 0; i < perScenario; i++) {
            double speed = 0.5 + rng.nextDouble() * 1.0;
            double failed = 1.0 + rng.nextInt(4);
            double dup = 0.0;
            double authFail = 20.0 + rng.nextInt(60); // 20 - 80 auth failures!
            double pendingTx = rng.nextInt(2);
            double latency = 3.0 + rng.nextDouble() * 4.0;
            double baselineDiff = 0.2;

            double[] f = new double[] { speed, failed, dup, authFail, pendingTx, latency, baselineDiff };
            dataset.add(new LabeledSample(f, true, "CREDENTIAL_BRUTE_FORCE"));
        }

        // Scenario C: Duplicate Ballot Collision Storm (Coordinated replay attempt)
        for (int i = 0; i < perScenario; i++) {
            double speed = 1.0 + rng.nextDouble() * 2.0;
            double failed = 5.0 + rng.nextInt(15);
            double dup = 12.0 + rng.nextInt(35); // 12 - 47 duplicate vote attempts blocked!
            double authFail = rng.nextInt(4);
            double pendingTx = rng.nextInt(3);
            double latency = 4.0 + rng.nextDouble() * 5.0;
            double baselineDiff = 0.5;

            double[] f = new double[] { speed, failed, dup, authFail, pendingTx, latency, baselineDiff };
            dataset.add(new LabeledSample(f, true, "DUPLICATE_COLLISION_STORM"));
        }

        // Scenario D: Blockchain RPC Outage / Stalled Confirmation Pipeline
        for (int i = 0; i < perScenario; i++) {
            double speed = 0.8 + rng.nextDouble() * 1.5;
            double failed = rng.nextInt(3);
            double dup = 0.0;
            double authFail = rng.nextInt(2);
            double pendingTx = 15.0 + rng.nextInt(40); // 15 - 55 pending transactions stuck!
            double latency = 120.0 + rng.nextDouble() * 300.0; // 120 - 420 seconds latency!
            double baselineDiff = 0.3;

            double[] f = new double[] { speed, failed, dup, authFail, pendingTx, latency, baselineDiff };
            dataset.add(new LabeledSample(f, true, "BLOCKCHAIN_RPC_STALL"));
        }

        return dataset;
    }

    /**
     * Extracts training feature vectors from normal operational samples.
     */
    public static List<double[]> getNormalTrainingData(int count, long seed) {
        List<LabeledSample> dataset = generateBenchmarkDataset(count, 0, seed);
        List<double[]> list = new ArrayList<>(count);
        for (LabeledSample s : dataset) {
            list.add(s.getFeatures());
        }
        return list;
    }
}
