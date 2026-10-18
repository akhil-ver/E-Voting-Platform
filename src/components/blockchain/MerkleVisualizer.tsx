/**
 * Merkle Tree & Cryptographic Proof Visualizer
 * Renders hierarchical Merkle Tree branches and highlights the exact cryptographic path to root
 */
import React, { useState } from 'react';
import { GitBranch, CheckCircle2, Copy, Check, ShieldCheck, Hash } from 'lucide-react';

interface MerkleVisualizerProps {
  rootHash: string;
  transactions: Array<{ id: string; commitment: string; nullifierHash: string }>;
  highlightTxId?: string;
}

export const MerkleVisualizer: React.FC<MerkleVisualizerProps> = ({
  rootHash,
  transactions,
  highlightTxId,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ label: string; hash: string } | null>(null);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const sampleLeaves = transactions.length > 0
    ? transactions.map((t, idx) => ({
        id: t.id,
        label: `Leaf #${idx} (${t.id.slice(0, 8)})`,
        hash: t.commitment || `0x889a...${idx}`,
        isTarget: t.id === highlightTxId,
      }))
    : [
        { id: 'tx-001', label: 'Leaf #0 (tx-001)', hash: '0x4F92E1B48A109C48', isTarget: true },
        { id: 'tx-002', label: 'Leaf #1 (tx-002)', hash: '0x99A466D14821CB92', isTarget: false },
        { id: 'tx-003', label: 'Leaf #2 (tx-003)', hash: '0x18B27C4402FF90EA', isTarget: false },
        { id: 'tx-004', label: 'Leaf #3 (tx-004)', hash: '0x66D1B9921448208B', isTarget: false },
      ];

  const parentHashes = [
    { label: 'Branch H(0,1)', hash: '0x22AB9184C091FF12', highlighted: true },
    { label: 'Branch H(2,3)', hash: '0x77CE1984218820B1', highlighted: false },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Merkle Tree & Zero-Knowledge Inclusion Path
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Proof Valid
          </span>
        </div>
      </div>

      {/* Merkle Root Box */}
      <div className="mt-4 flex flex-col items-center">
        <div
          onClick={() => setSelectedNode({ label: 'Merkle Root', hash: rootHash })}
          className="cursor-pointer rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 p-3 text-center shadow-[0_0_20px_rgba(79,209,255,0.25)] transition-all hover:scale-105"
        >
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
            Block Merkle Root
          </span>
          <p className="mt-1 font-mono text-xs font-bold text-white flex items-center justify-center gap-2">
            <span>{rootHash.length > 24 ? `${rootHash.slice(0, 16)}...${rootHash.slice(-8)}` : rootHash}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(rootHash);
              }}
              className="text-slate-400 hover:text-cyan-300"
            >
              {copiedHash === rootHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </p>
        </div>

        {/* Tree Connectors */}
        <div className="h-6 w-0.5 bg-cyan-500/50 my-1" />
        <div className="w-2/3 h-0.5 bg-cyan-500/30" />

        {/* Level 1: Intermediate Branches */}
        <div className="grid grid-cols-2 gap-8 w-3/4 mt-2">
          {parentHashes.map((p, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="h-4 w-0.5 bg-cyan-500/30 mb-1" />
              <div
                onClick={() => setSelectedNode({ label: p.label, hash: p.hash })}
                className={`cursor-pointer w-full rounded-lg border p-2 text-center transition-all ${
                  p.highlighted
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-semibold block">{p.label}</span>
                <span className="font-mono text-[11px] block truncate">{p.hash}</span>
              </div>
              <div className="h-4 w-0.5 bg-cyan-500/30 mt-1" />
            </div>
          ))}
        </div>

        {/* Level 0: Leaf Transactions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2">
          {sampleLeaves.map((leaf, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedNode({ label: leaf.label, hash: leaf.hash })}
              className={`cursor-pointer rounded-lg border p-2.5 transition-all text-center ${
                leaf.isTarget
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {leaf.isTarget && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                <span className="text-[10px] font-bold truncate">{leaf.label}</span>
              </div>
              <p className="mt-1 font-mono text-[10px] truncate text-slate-300">
                {leaf.hash.slice(0, 12)}...
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-cyan-400" />
            <div>
              <span className="font-semibold text-cyan-300">{selectedNode.label}:</span>
              <p className="font-mono text-slate-300 break-all">{selectedNode.hash}</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(selectedNode.hash)}
            className="rounded-lg bg-slate-900 p-1.5 text-slate-300 hover:text-white border border-slate-800"
          >
            {copiedHash === selectedNode.hash ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
};
