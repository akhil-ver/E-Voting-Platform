package com.sovereign.democracy.ai.anomaly;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.*;

/**
 * Pure Java implementation of the Isolation Forest (iForest) algorithm (Liu, Ting, Zhou 2008).
 * Fully self-contained, reproducible via random seed, zero external C/Python dependencies,
 * and calibrated specifically for multi-dimensional election telemetry anomaly detection.
 */
@Component
public class IsolationForestModel implements Serializable {

    private static final Logger log = LoggerFactory.getLogger(IsolationForestModel.class);
    private static final double EULER_MASCHERONI = 0.5772156649;

    public static final String MODEL_VERSION = "IsolationForest-v1.0";
    public static final double WARNING_THRESHOLD = 0.58;
    public static final double CRITICAL_THRESHOLD = 0.70;

    private final int numTrees;
    private final int subSampleSize;
    private final int maxDepth;
    private final long randomSeed;

    private final List<IsolationTreeNode> trees = new ArrayList<>();
    private double[] baselineFeatureMeans;
    private boolean isFitted = false;

    public IsolationForestModel() {
        this(100, 256, 42L);
    }

    public IsolationForestModel(int numTrees, int subSampleSize, long randomSeed) {
        this.numTrees = numTrees;
        this.subSampleSize = subSampleSize;
        this.maxDepth = (int) Math.ceil(Math.log(subSampleSize) / Math.log(2));
        this.randomSeed = randomSeed;
    }

    /**
     * Fits the Isolation Forest ensemble on training data.
     *
     * @param trainingData List of feature vectors of dimension d
     */
    public synchronized void fit(List<double[]> trainingData) {
        if (trainingData == null || trainingData.isEmpty()) {
            throw new IllegalArgumentException("Training data cannot be null or empty");
        }

        int n = trainingData.size();
        int d = trainingData.get(0).length;
        Random rng = new Random(randomSeed);

        // Calculate baseline feature means
        baselineFeatureMeans = new double[d];
        for (double[] row : trainingData) {
            for (int j = 0; j < d; j++) {
                baselineFeatureMeans[j] += row[j];
            }
        }
        for (int j = 0; j < d; j++) {
            baselineFeatureMeans[j] /= n;
        }

        trees.clear();
        int sampleSize = Math.min(n, subSampleSize);

        for (int i = 0; i < numTrees; i++) {
            // Subsample without replacement
            List<double[]> sample = subsample(trainingData, sampleSize, rng);
            IsolationTreeNode root = buildTree(sample, 0, maxDepth, rng);
            trees.add(root);
        }

        this.isFitted = true;
        log.info("Fitted Isolation Forest [{}] with {} trees on {} training samples (dimension={})",
                MODEL_VERSION, trees.size(), n, d);
    }

    private List<double[]> subsample(List<double[]> data, int sampleSize, Random rng) {
        List<double[]> copy = new ArrayList<>(data);
        Collections.shuffle(copy, rng);
        return new ArrayList<>(copy.subList(0, sampleSize));
    }

    private IsolationTreeNode buildTree(List<double[]> sample, int currentDepth, int depthLimit, Random rng) {
        int n = sample.size();
        if (currentDepth >= depthLimit || n <= 1) {
            return new IsolationTreeNode(n);
        }

        int d = sample.get(0).length;

        // Try features with non-constant values
        List<Integer> featureIndices = new ArrayList<>();
        for (int j = 0; j < d; j++) {
            featureIndices.add(j);
        }
        Collections.shuffle(featureIndices, rng);

        for (int splitFeature : featureIndices) {
            double min = Double.POSITIVE_INFINITY;
            double max = Double.NEGATIVE_INFINITY;
            for (double[] row : sample) {
                double val = row[splitFeature];
                if (val < min) min = val;
                if (val > max) max = val;
            }

            if (max > min) {
                double splitValue = min + rng.nextDouble() * (max - min);

                List<double[]> leftSample = new ArrayList<>();
                List<double[]> rightSample = new ArrayList<>();

                for (double[] row : sample) {
                    if (row[splitFeature] < splitValue) {
                        leftSample.add(row);
                    } else {
                        rightSample.add(row);
                    }
                }

                // If split separated data
                if (!leftSample.isEmpty() && !rightSample.isEmpty()) {
                    IsolationTreeNode leftChild = buildTree(leftSample, currentDepth + 1, depthLimit, rng);
                    IsolationTreeNode rightChild = buildTree(rightSample, currentDepth + 1, depthLimit, rng);
                    return new IsolationTreeNode(splitFeature, splitValue, leftChild, rightChild);
                }
            }
        }

        // All features constant in sample
        return new IsolationTreeNode(n);
    }

    /**
     * Computes the anomaly score s(x, n) in range [0, 1].
     * Values close to 1 indicate strong anomalies.
     * Values < 0.5 indicate normal operational patterns.
     */
    public double computeScore(double[] point) {
        if (!isFitted || trees.isEmpty()) {
            throw new IllegalStateException("Isolation Forest model has not been fitted yet");
        }
        double avgPathLength = computeAveragePathLength(point);
        double cFactor = c(subSampleSize);
        if (cFactor <= 0) return 0.5;

        double exponent = - (avgPathLength / cFactor);
        double score = Math.pow(2.0, exponent);
        return Math.max(0.0, Math.min(1.0, score));
    }

    /**
     * Computes average path length across all isolation trees.
     */
    public double computeAveragePathLength(double[] point) {
        double totalPathLength = 0.0;
        for (IsolationTreeNode tree : trees) {
            totalPathLength += pathLength(point, tree, 0);
        }
        return totalPathLength / trees.size();
    }

    private double pathLength(double[] point, IsolationTreeNode node, int currentDepth) {
        if (node.isLeaf()) {
            return currentDepth + c(node.getSize());
        }
        int feature = node.getSplitFeature();
        if (point[feature] < node.getSplitValue()) {
            return pathLength(point, node.getLeft(), currentDepth + 1);
        } else {
            return pathLength(point, node.getRight(), currentDepth + 1);
        }
    }

    /**
     * Average path length of unsuccessful search in a Binary Search Tree (BST).
     * c(n) = 2 * (ln(n - 1) + 0.5772156649) - (2 * (n - 1) / n)
     */
    public static double c(int n) {
        if (n <= 1) return 0.0;
        if (n == 2) return 1.0;
        return 2.0 * (Math.log(n - 1) + EULER_MASCHERONI) - (2.0 * (n - 1) / n);
    }

    /**
     * Identifies the primary operational metrics that contributed most significantly to an anomaly.
     */
    public Map<String, Double> computeContributingMetrics(double[] point) {
        Map<String, Double> contributions = new LinkedHashMap<>();
        if (baselineFeatureMeans == null || point == null) {
            return contributions;
        }

        int d = Math.min(point.length, baselineFeatureMeans.length);
        for (int i = 0; i < d; i++) {
            String name = (i < AnomalyFeatureVector.FEATURE_NAMES.length) ? AnomalyFeatureVector.FEATURE_NAMES[i] : "feature_" + i;
            double baseline = baselineFeatureMeans[i];
            double observed = point[i];

            // Deviation score normalized by scale
            double scale = Math.max(1.0, baseline);
            double deviation = Math.abs(observed - baseline) / scale;
            contributions.put(name, Math.round(deviation * 100.0) / 100.0);
        }

        return contributions;
    }

    public boolean isFitted() {
        return isFitted;
    }

    public int getNumTrees() {
        return trees.size();
    }

    public double[] getBaselineFeatureMeans() {
        return baselineFeatureMeans;
    }
}
