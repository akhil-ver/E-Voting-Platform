package com.sovereign.democracy.ai.anomaly;

import java.io.Serializable;

/**
 * Node in an Isolation Tree (iTree).
 */
public class IsolationTreeNode implements Serializable {

    private final boolean isLeaf;
    private final int size; // Size of samples if leaf
    private int splitFeature;
    private double splitValue;
    private IsolationTreeNode left;
    private IsolationTreeNode right;

    // Leaf constructor
    public IsolationTreeNode(int size) {
        this.isLeaf = true;
        this.size = size;
        this.splitFeature = -1;
        this.splitValue = 0.0;
    }

    // Internal node constructor
    public IsolationTreeNode(int splitFeature, double splitValue, IsolationTreeNode left, IsolationTreeNode right) {
        this.isLeaf = false;
        this.size = 0;
        this.splitFeature = splitFeature;
        this.splitValue = splitValue;
        this.left = left;
        this.right = right;
    }

    public boolean isLeaf() { return isLeaf; }
    public int getSize() { return size; }
    public int getSplitFeature() { return splitFeature; }
    public double getSplitValue() { return splitValue; }
    public IsolationTreeNode getLeft() { return left; }
    public IsolationTreeNode getRight() { return right; }
}
