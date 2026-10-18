#!/usr/bin/env python3
"""
Reproducible Training and Evaluation Pipeline for Election Anomaly Detection (Isolation Forest).
Model Version: IsolationForest-v1.0
Author: Sovereign Democracy ML Engineering Team

Features:
1. acceptedBallotsPerMin: Accepted voting rate in ballots/minute
2. failedSubmissionsCount: Number of failed/rejected voting attempts in 15-min window
3. rejectedDuplicateAttempts: Number of duplicate-vote attempts blocked by constraint
4. authFailuresCount: Aggregated citizen/admin authentication failures
5. pendingBlockchainTxCount: Number of pending/broadcasting blockchain transactions
6. blockchainLatencySec: Blockchain confirmation latency / oldest unconfirmed tx age
7. speedVsBaselineDiff: Absolute difference between current speed and historical baseline
"""

import math
import random
import json
import os

EULER_MASCHERONI = 0.5772156649

def c_factor(n):
    if n <= 1:
        return 0.0
    if n == 2:
        return 1.0
    return 2.0 * (math.log(n - 1) + EULER_MASCHERONI) - (2.0 * (n - 1) / n)

class IsolationTreeNode:
    def __init__(self, size=0, split_feature=-1, split_value=0.0, left=None, right=None, is_leaf=False):
        self.is_leaf = is_leaf
        self.size = size
        self.split_feature = split_feature
        self.split_value = split_value
        self.left = left
        self.right = right

class PythonIsolationForest:
    def __init__(self, n_estimators=100, max_samples=256, random_state=42):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.max_depth = math.ceil(math.log2(max_samples))
        self.random_state = random_state
        self.trees = []
        self.rng = random.Random(random_state)

    def fit(self, X):
        self.trees = []
        n = len(X)
        sample_size = min(n, self.max_samples)
        for _ in range(self.n_estimators):
            sample = self.rng.sample(X, sample_size)
            tree = self._build_tree(sample, 0)
            self.trees.append(tree)

    def _build_tree(self, sample, current_depth):
        n = len(sample)
        if current_depth >= self.max_depth or n <= 1:
            return IsolationTreeNode(size=n, is_leaf=True)

        d = len(sample[0])
        feature_indices = list(range(d))
        self.rng.shuffle(feature_indices)

        for feature in feature_indices:
            values = [row[feature] for row in sample]
            min_val, max_val = min(values), max(values)
            if max_val > min_val:
                split_val = self.rng.uniform(min_val, max_val)
                left_sample = [r for r in sample if r[feature] < split_val]
                right_sample = [r for r in sample if r[feature] >= split_val]
                if left_sample and right_sample:
                    left_child = self._build_tree(left_sample, current_depth + 1)
                    right_child = self._build_tree(right_sample, current_depth + 1)
                    return IsolationTreeNode(split_feature=feature, split_value=split_val, left=left_child, right=right_child)

        return IsolationTreeNode(size=n, is_leaf=True)

    def compute_path_length(self, x, node, current_depth=0):
        if node.is_leaf:
            return current_depth + c_factor(node.size)
        if x[node.split_feature] < node.split_value:
            return self.compute_path_length(x, node.left, current_depth + 1)
        else:
            return self.compute_path_length(x, node.right, current_depth + 1)

    def score(self, x):
        avg_path = sum(self.compute_path_length(x, t) for t in self.trees) / len(self.trees)
        c = c_factor(self.max_samples)
        if c <= 0:
            return 0.5
        return 2.0 ** (- (avg_path / c))

def generate_synthetic_data(normal_count=600, anomaly_count=60, seed=42):
    rng = random.Random(seed)
    X_normal = []
    for _ in range(normal_count):
        speed = max(0.1, 0.8 + rng.gauss(0, 0.4))
        failed = 0.0 if rng.random() < 0.9 else 1.0
        dup = 0.0
        auth_fail = 0.0 if rng.random() < 0.85 else float(rng.randint(1, 2))
        pending_tx = 0.0 if rng.random() < 0.7 else float(rng.randint(1, 2))
        latency = max(1.0, 4.0 + rng.gauss(0, 2.0))
        delta = abs(rng.gauss(0, 0.3))
        X_normal.append([speed, failed, dup, auth_fail, pending_tx, latency, delta])

    X_anomalies = []
    # 4 distinct anomaly scenarios:
    per_scenario = anomaly_count // 4
    # 1. Vote Flooding
    for _ in range(per_scenario):
        X_anomalies.append([rng.uniform(18.0, 45.0), rng.randint(1, 4), rng.randint(0, 2), rng.randint(0, 2), rng.randint(4, 9), rng.uniform(15.0, 30.0), rng.uniform(15.0, 35.0)])
    # 2. Auth Brute Force
    for _ in range(per_scenario):
        X_anomalies.append([rng.uniform(0.5, 1.2), rng.randint(1, 4), 0.0, rng.randint(25, 75), rng.randint(0, 2), rng.uniform(2.0, 6.0), 0.2])
    # 3. Duplicate Vote Storm
    for _ in range(per_scenario):
        X_anomalies.append([rng.uniform(0.8, 2.0), rng.randint(5, 12), rng.randint(15, 45), rng.randint(0, 3), rng.randint(0, 2), rng.uniform(3.0, 6.0), 0.4])
    # 4. Blockchain RPC Stall
    for _ in range(per_scenario):
        X_anomalies.append([rng.uniform(0.5, 1.5), rng.randint(0, 2), 0.0, rng.randint(0, 2), rng.randint(18, 50), rng.uniform(150.0, 400.0), 0.3])

    return X_normal, X_anomalies

def evaluate_model():
    print("=================================================================")
    print("Sovereign Democracy — Isolation Forest Anomaly Evaluation (v1.0)")
    print("=================================================================")

    # Split train/test (80/20)
    X_train_norm, _ = generate_synthetic_data(normal_count=500, anomaly_count=0, seed=42)
    X_test_norm, X_test_anom = generate_synthetic_data(normal_count=150, anomaly_count=50, seed=99)

    model = PythonIsolationForest(n_estimators=100, max_samples=256, random_state=42)
    model.fit(X_train_norm)

    threshold = 0.58
    norm_scores = [model.score(x) for x in X_test_norm]
    anom_scores = [model.score(x) for x in X_test_anom]

    # Metrics
    tp = sum(1 for s in anom_scores if s >= threshold)
    fn = len(anom_scores) - tp
    fp = sum(1 for s in norm_scores if s >= threshold)
    tn = len(norm_scores) - fp

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0

    avg_normal_score = sum(norm_scores) / len(norm_scores)
    avg_anom_score = sum(anom_scores) / len(anom_scores)

    report = {
        "model_version": "IsolationForest-v1.0",
        "algorithm": "Isolation Forest (Liu, Ting, Zhou 2008)",
        "hyperparameters": {
            "n_estimators": 100,
            "max_samples": 256,
            "max_depth": 8,
            "random_state": 42,
            "threshold_warning": 0.58,
            "threshold_critical": 0.70
        },
        "evaluation_metrics": {
            "test_normal_samples": len(X_test_norm),
            "test_anomaly_samples": len(X_test_anom),
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "false_positive_rate": round(fpr, 4),
            "avg_normal_score": round(avg_normal_score, 4),
            "avg_anomaly_score": round(avg_anom_score, 4)
        },
        "feature_dimensions": [
            "acceptedBallotsPerMin",
            "failedSubmissionsCount",
            "rejectedDuplicateAttempts",
            "authFailuresCount",
            "pendingBlockchainTxCount",
            "blockchainLatencySec",
            "speedVsBaselineDiff"
        ],
        "limitation_note": "Calibrated on synthetic election operational data for demonstration. False positive rate may differ in real-world deployment."
    }

    print(f"Normal Test Count:    {len(X_test_norm)} (Avg Score: {avg_normal_score:.4f})")
    print(f"Anomaly Test Count:   {len(X_test_anom)} (Avg Score: {avg_anom_score:.4f})")
    print(f"Precision:            {precision:.4f}")
    print(f"Recall:               {recall:.4f}")
    print(f"F1 Score:             {f1:.4f}")
    print(f"False Positive Rate:  {fpr:.4f}")

    out_path = os.path.join(os.path.dirname(__file__), "model_evaluation_report.json")
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Saved evaluation report to {out_path}")

if __name__ == "__main__":
    evaluate_model()
