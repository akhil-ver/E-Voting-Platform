/**
 * Interactive Election Scenario Replay Engine
 * Plays back simulated election event timelines with speed controls and cryptographic step annotations
 */
import React, { useState, useEffect } from 'react';
import {
  History,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Key,
  CheckCircle2,
} from 'lucide-react';

interface ReplayEvent {
  id: string;
  timeOffset: string;
  type: 'AUTH' | 'VOTE' | 'BLOCK' | 'FRAUD' | 'CONSENSUS' | 'THRESHOLD';
  title: string;
  description: string;
  cryptoProof: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING';
}

export const ElectionReplay: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const timelineEvents: ReplayEvent[] = [
    {
      id: 'evt-01',
      timeOffset: '00:00:01',
      type: 'AUTH',
      title: 'Election State Transitioned to VOTING_OPEN',
      description: 'The Election Commission signs state transition authorization with threshold multi-sig key.',
      cryptoProof: 'ECDSA_SIG_AUTHORITY_0x8F91...VALID',
      severity: 'INFO',
    },
    {
      id: 'evt-02',
      timeOffset: '00:01:14',
      type: 'VOTE',
      title: 'Voter #0492 Registers P-256 Key & Receives Voting Token',
      description: 'Client generates WebCrypto key pair; server issues single-use anonymous nullifier token.',
      cryptoProof: 'NULLIFIER_HASH_0x4F92...MINTED',
      severity: 'SUCCESS',
    },
    {
      id: 'evt-03',
      timeOffset: '00:02:05',
      type: 'VOTE',
      title: 'Encrypted Ballot Cast (Candidate: Dr. Elena Vance)',
      description: 'Choice blinded with random salt r, encrypted via AES-256-GCM, and signed with ECDSA private key.',
      cryptoProof: 'COMMITMENT_C_0x99B4...DERIVED',
      severity: 'SUCCESS',
    },
    {
      id: 'evt-04',
      timeOffset: '00:02:18',
      type: 'FRAUD',
      title: 'Adversarial Sybil Double-Vote Blocked (Session S-104)',
      description: 'Attacker attempts duplicate ballot with consumed nullifier. Deterministically rejected by mempool filter.',
      cryptoProof: 'REJECT_DUPLICATE_NULLIFIER_0x4F92',
      severity: 'WARNING',
    },
    {
      id: 'evt-05',
      timeOffset: '00:03:00',
      type: 'BLOCK',
      title: 'Block #1 Mined with 2/3 Multi-Party Validator Quorum',
      description: 'Validators (EC, Auditor, Public Observer) verify Merkle root and attach BFT consensus signatures.',
      cryptoProof: 'MERKLE_ROOT_0x889A...3_SIGS_VALID',
      severity: 'SUCCESS',
    },
    {
      id: 'evt-06',
      timeOffset: '00:04:30',
      type: 'THRESHOLD',
      title: 'Multi-Party Threshold Keyholders Release Results',
      description: '2 of 3 Shamir keyholders approve tally release, homomorphically decrypting certified candidate totals.',
      cryptoProof: 'THRESHOLD_SHARDS_2_OF_3_RECOMBINED',
      severity: 'SUCCESS',
    },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev >= timelineEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500 / playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, playbackSpeed, timelineEvents.length]);

  const currentEvent = timelineEvents[currentIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(79,209,255,0.3)]">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Election Incident & Event Replay Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Step-by-step cryptographic audit playback with speed controls and event annotations.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className="rounded-xl bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 border border-slate-800 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="rounded-xl bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(timelineEvents.length - 1, prev + 1))}
              disabled={currentIndex === timelineEvents.length - 1}
              className="rounded-xl bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs text-slate-400">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-1 rounded-lg font-mono font-bold ${
                    playbackSpeed === speed ? 'bg-cyan-500 text-black' : 'hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Playback Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline Event List */}
        <div className="space-y-2">
          {timelineEvents.map((evt, idx) => {
            const isCurrent = currentIndex === idx;
            return (
              <div
                key={evt.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(false);
                }}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs ${
                  isCurrent
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(79,209,255,0.2)]'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">{evt.timeOffset}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      evt.severity === 'WARNING'
                        ? 'bg-rose-950 text-rose-400'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {evt.type}
                  </span>
                </div>
                <h4 className="font-bold text-white mt-1 line-clamp-1">{evt.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Current Active Event Highlight Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs text-cyan-400 font-bold">
                TIMELINE STEP #{currentIndex + 1} OF {timelineEvents.length}
              </span>
              <span className="font-mono text-xs text-slate-500">
                T+{currentEvent.timeOffset}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-4">{currentEvent.title}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{currentEvent.description}</p>

            <div className="mt-6 rounded-xl bg-slate-900/80 p-4 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Cryptographic Attestation Proof
              </span>
              <p className="mt-1 font-mono text-xs text-emerald-300 font-bold break-all">
                {currentEvent.cryptoProof}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Deterministic state machine validated</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Audit Chained
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
