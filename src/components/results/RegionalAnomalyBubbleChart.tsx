/**
 * D3-based Interactive Regional Anomaly Bubble Chart
 * Visualizes real-time anomaly detection scores and threat levels across voting districts
 * Features:
 * - D3 Force Simulation with dynamic collision bounds and fluid physics
 * - Bubble radius mapped to voting volume / electorate size (d3.scaleSqrt)
 * - Color scale mapped to anomaly risk score (0 - 100) (Low -> Moderate -> High -> Critical)
 * - Glowing aura and pulse animation for high-anomaly zones
 * - Interactive hover tooltips and click-to-inspect district threat breakdowns
 * - Real-time simulation tick for live anomaly telemetry updates
 * - Accessible alternative data table for WCAG AA compliance
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Sparkles,
  Table as TableIcon,
  RefreshCw,
  Search,
  Filter,
  Radio,
  Sliders,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export interface DistrictAnomalyDatum {
  id: string;
  name: string;
  state: string;
  totalVoters: number;
  votesCast: number;
  turnoutPercentage: number;
  anomalyScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryThreatVector: string;
  flaggedIncidentsCount: number;
  networkLatencyMs: number;
  subStationsCount: number;
  consensusIntegrity: number; // e.g. 99.8%
  lastUpdated: string;
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
}

const INITIAL_DISTRICTS: DistrictAnomalyDatum[] = [
  {
    id: 'dist-mum-south',
    name: 'Mumbai South',
    state: 'Maharashtra',
    totalVoters: 54000,
    votesCast: 42120,
    turnoutPercentage: 78.0,
    anomalyScore: 14,
    riskLevel: 'LOW',
    primaryThreatVector: 'Nominal ECDSA Verification Baseline',
    flaggedIncidentsCount: 1,
    networkLatencyMs: 38,
    subStationsCount: 142,
    consensusIntegrity: 99.9,
    lastUpdated: 'Just now',
  },
  {
    id: 'dist-del-central',
    name: 'Delhi Central',
    state: 'Delhi NCR',
    totalVoters: 68000,
    votesCast: 56440,
    turnoutPercentage: 83.0,
    anomalyScore: 46,
    riskLevel: 'MODERATE',
    primaryThreatVector: 'Mempool Submission Velocity Spike',
    flaggedIncidentsCount: 7,
    networkLatencyMs: 115,
    subStationsCount: 186,
    consensusIntegrity: 98.4,
    lastUpdated: '1m ago',
  },
  {
    id: 'dist-blr-north',
    name: 'Bengaluru North',
    state: 'Karnataka',
    totalVoters: 49000,
    votesCast: 35280,
    turnoutPercentage: 72.0,
    anomalyScore: 18,
    riskLevel: 'LOW',
    primaryThreatVector: 'Zero-Knowledge Proof Batch Verified',
    flaggedIncidentsCount: 0,
    networkLatencyMs: 44,
    subStationsCount: 120,
    consensusIntegrity: 100.0,
    lastUpdated: 'Just now',
  },
  {
    id: 'dist-pun-east',
    name: 'Pune East',
    state: 'Maharashtra',
    totalVoters: 39000,
    votesCast: 31200,
    turnoutPercentage: 80.0,
    anomalyScore: 78,
    riskLevel: 'CRITICAL',
    primaryThreatVector: 'Repeated Nullifier Replay / Bot Cadence',
    flaggedIncidentsCount: 19,
    networkLatencyMs: 280,
    subStationsCount: 98,
    consensusIntegrity: 94.2,
    lastUpdated: '30s ago',
  },
  {
    id: 'dist-hyd-tech',
    name: 'Hyderabad Tech Corridor',
    state: 'Telangana',
    totalVoters: 58000,
    votesCast: 43500,
    turnoutPercentage: 75.0,
    anomalyScore: 32,
    riskLevel: 'MODERATE',
    primaryThreatVector: 'Asymmetric Polling Station Arrival Intervals',
    flaggedIncidentsCount: 4,
    networkLatencyMs: 68,
    subStationsCount: 154,
    consensusIntegrity: 99.1,
    lastUpdated: '2m ago',
  },
  {
    id: 'dist-kol-urban',
    name: 'Kolkata Metro',
    state: 'West Bengal',
    totalVoters: 44000,
    votesCast: 31680,
    turnoutPercentage: 72.0,
    anomalyScore: 84,
    riskLevel: 'CRITICAL',
    primaryThreatVector: 'Rate-Limit Burst & Signature Malformation',
    flaggedIncidentsCount: 23,
    networkLatencyMs: 340,
    subStationsCount: 110,
    consensusIntegrity: 92.8,
    lastUpdated: '15s ago',
  },
  {
    id: 'dist-che-central',
    name: 'Chennai Central',
    state: 'Tamil Nadu',
    totalVoters: 51000,
    votesCast: 39780,
    turnoutPercentage: 78.0,
    anomalyScore: 12,
    riskLevel: 'LOW',
    primaryThreatVector: 'Nominal Consensus & Cryptographic Integrity',
    flaggedIncidentsCount: 0,
    networkLatencyMs: 35,
    subStationsCount: 135,
    consensusIntegrity: 99.9,
    lastUpdated: 'Just now',
  },
  {
    id: 'dist-ahm-west',
    name: 'Ahmedabad West',
    state: 'Gujarat',
    totalVoters: 42000,
    votesCast: 31500,
    turnoutPercentage: 75.0,
    anomalyScore: 61,
    riskLevel: 'HIGH',
    primaryThreatVector: 'High-Density Geofence Deviation Ingress',
    flaggedIncidentsCount: 12,
    networkLatencyMs: 195,
    subStationsCount: 104,
    consensusIntegrity: 96.5,
    lastUpdated: '45s ago',
  },
  {
    id: 'dist-jai-north',
    name: 'Jaipur North',
    state: 'Rajasthan',
    totalVoters: 36000,
    votesCast: 25200,
    turnoutPercentage: 70.0,
    anomalyScore: 24,
    riskLevel: 'LOW',
    primaryThreatVector: 'Periodic Validator Heartbeat Synchronized',
    flaggedIncidentsCount: 2,
    networkLatencyMs: 52,
    subStationsCount: 88,
    consensusIntegrity: 99.5,
    lastUpdated: '3m ago',
  },
  {
    id: 'dist-luc-canton',
    name: 'Lucknow Central',
    state: 'Uttar Pradesh',
    totalVoters: 62000,
    votesCast: 47740,
    turnoutPercentage: 77.0,
    anomalyScore: 54,
    riskLevel: 'HIGH',
    primaryThreatVector: 'Sub-Human Timing Intervals (<300ms)',
    flaggedIncidentsCount: 9,
    networkLatencyMs: 160,
    subStationsCount: 165,
    consensusIntegrity: 97.2,
    lastUpdated: '1m ago',
  },
];

interface RegionalAnomalyBubbleChartProps {
  electionId?: string;
  electionName?: string;
}

export const RegionalAnomalyBubbleChart: React.FC<RegionalAnomalyBubbleChartProps> = ({
  electionId,
  electionName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [districts, setDistricts] = useState<DistrictAnomalyDatum[]>(INITIAL_DISTRICTS);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictAnomalyDatum | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictAnomalyDatum | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'LOW' | 'MODERATE' | 'HIGH_CRITICAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [showTableView, setShowTableView] = useState<boolean>(false);
  const [simulationTriggerCount, setSimulationTriggerCount] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 480,
  });

  // Observe container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const calculatedHeight = Math.max(380, Math.min(520, width * 0.58));
          setDimensions({ width, height: calculatedHeight });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Periodic Live Anomaly Telemetry Ingestion Simulator
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDistricts((prev) =>
        prev.map((d) => {
          // slight stochastic jitter in anomaly score to simulate live streaming
          const delta = (Math.random() - 0.48) * 4;
          const newScore = Math.max(5, Math.min(96, Math.round(d.anomalyScore + delta)));
          let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
          if (newScore > 75) riskLevel = 'CRITICAL';
          else if (newScore > 50) riskLevel = 'HIGH';
          else if (newScore > 25) riskLevel = 'MODERATE';

          return {
            ...d,
            anomalyScore: newScore,
            riskLevel,
            lastUpdated: 'Live telemetry update',
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    return districts.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.primaryThreatVector.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterLevel === 'ALL') return true;
      if (filterLevel === 'LOW') return d.riskLevel === 'LOW';
      if (filterLevel === 'MODERATE') return d.riskLevel === 'MODERATE';
      if (filterLevel === 'HIGH_CRITICAL') return d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL';
      return true;
    });
  }, [districts, filterLevel, searchQuery]);

  // Color generator based on Anomaly Score
  const getRiskColor = (score: number, opacity = 1) => {
    if (score > 75) return `rgba(244, 63, 94, ${opacity})`; // Rose / Red (Critical)
    if (score > 50) return `rgba(249, 115, 22, ${opacity})`; // Orange (High)
    if (score > 25) return `rgba(245, 158, 11, ${opacity})`; // Amber (Moderate)
    return `rgba(6, 182, 212, ${opacity})`; // Cyan (Low / Safe)
  };

  const getRiskStroke = (score: number) => {
    if (score > 75) return '#f43f5e';
    if (score > 50) return '#f97316';
    if (score > 25) return '#f59e0b';
    return '#06b6d4';
  };

  // D3 Force Simulation Effect
  useEffect(() => {
    if (!svgRef.current || showTableView || filteredDistricts.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    // Sqrt scale for circle radius based on electorate size (votesCast)
    const minVotes = d3.min(districts, (d: DistrictAnomalyDatum) => d.votesCast) ?? 20000;
    const maxVotes = d3.max(districts, (d: DistrictAnomalyDatum) => d.votesCast) ?? 60000;
    const radiusScale = d3
      .scaleSqrt()
      .domain([Number(minVotes), Number(maxVotes)])
      .range([width < 600 ? 28 : 38, width < 600 ? 54 : 76]);

    // Create copy of nodes for simulation
    const nodes: DistrictAnomalyDatum[] = filteredDistricts.map((d) => ({
      ...d,
      radius: radiusScale(d.votesCast),
      x: d.x ?? width / 2 + (Math.random() - 0.5) * 100,
      y: d.y ?? height / 2 + (Math.random() - 0.5) * 100,
    }));

    // SVG Defs for Gradients & Glow Filters
    const defs = svg.append('defs');

    // Glow Filter for high anomaly
    const filter = defs.append('filter').attr('id', 'anomaly-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Radial gradients for each node
    nodes.forEach((node) => {
      const gradId = `grad-${node.id}`;
      const radialGradient = defs
        .append('radialGradient')
        .attr('id', gradId)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '70%');

      if (node.anomalyScore > 75) {
        radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fda4af').attr('stop-opacity', '0.9');
        radialGradient.append('stop').attr('offset', '50%').attr('stop-color', '#e11d48').attr('stop-opacity', '0.7');
        radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#4c0519').attr('stop-opacity', '0.85');
      } else if (node.anomalyScore > 50) {
        radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fed7aa').attr('stop-opacity', '0.9');
        radialGradient.append('stop').attr('offset', '50%').attr('stop-color', '#ea580c').attr('stop-opacity', '0.7');
        radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#431407').attr('stop-opacity', '0.85');
      } else if (node.anomalyScore > 25) {
        radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fde68a').attr('stop-opacity', '0.9');
        radialGradient.append('stop').attr('offset', '50%').attr('stop-color', '#d97706').attr('stop-opacity', '0.7');
        radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#451a03').attr('stop-opacity', '0.85');
      } else {
        radialGradient.append('stop').attr('offset', '0%').attr('stop-color', '#a5f3fc').attr('stop-opacity', '0.9');
        radialGradient.append('stop').attr('offset', '50%').attr('stop-color', '#0891b2').attr('stop-opacity', '0.7');
        radialGradient.append('stop').attr('offset', '100%').attr('stop-color', '#083344').attr('stop-opacity', '0.85');
      }
    });

    const g = svg.append('g');

    // Force Simulation setup
    const simulation = d3
      .forceSimulation(nodes)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('charge', d3.forceManyBody().strength((d: any) => -((d.radius || 30) ** 1.35) * 0.4))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => (d.radius || 30) + 6).iterations(3)
      )
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))
      .alphaDecay(0.02);

    // Node container groups
    const nodeGroups = g
      .selectAll('.bubble-node')
      .data(nodes, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'bubble-node cursor-pointer')
      .on('mouseenter', (event, d) => {
        setHoveredDistrict(d);
        d3.select(event.currentTarget as SVGGElement).select('.main-circle').attr('stroke-width', 3.5).attr('filter', 'url(#anomaly-glow)');
      })
      .on('mouseleave', (event, d) => {
        setHoveredDistrict(null);
        d3.select(event.currentTarget as SVGGElement).select('.main-circle').attr('stroke-width', 2).attr('filter', null);
      })
      .on('click', (event, d) => {
        setSelectedDistrict(d);
      });

    // Pulsing Outer Radar Ring for critical/high anomalies
    nodeGroups
      .filter((d) => d.anomalyScore > 50)
      .append('circle')
      .attr('r', (d) => (d.radius || 30) + 7)
      .attr('fill', 'none')
      .attr('stroke', (d) => getRiskStroke(d.anomalyScore))
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.6)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('values', (d) => `${(d.radius || 30) + 2};${(d.radius || 30) + 12};${(d.radius || 30) + 2}`)
      .attr('dur', (d) => (d.anomalyScore > 75 ? '1.5s' : '2.5s'))
      .attr('repeatCount', 'indefinite');

    // Main Bubble Circle
    nodeGroups
      .append('circle')
      .attr('class', 'main-circle transition-all duration-200')
      .attr('r', (d) => d.radius || 30)
      .attr('fill', (d) => `url(#grad-${d.id})`)
      .attr('stroke', (d) => getRiskStroke(d.anomalyScore))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.85);

    // Score Badge Pill inside Bubble
    nodeGroups
      .append('rect')
      .attr('x', -24)
      .attr('y', (d) => -(d.radius || 30) * 0.45 - 8)
      .attr('width', 48)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', 'rgba(15, 23, 42, 0.85)')
      .attr('stroke', (d) => getRiskStroke(d.anomalyScore))
      .attr('stroke-width', 1);

    nodeGroups
      .append('text')
      .attr('x', 0)
      .attr('y', (d) => -(d.radius || 30) * 0.45 + 3.5)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => getRiskStroke(d.anomalyScore))
      .attr('font-size', '9.5px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => `${d.anomalyScore} Risk`);

    // District Name Label
    nodeGroups
      .append('text')
      .attr('x', 0)
      .attr('y', (d) => ((d.radius || 30) > 45 ? 6 : 4))
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => ((d.radius || 30) > 55 ? '12px' : '10.5px'))
      .attr('font-weight', '700')
      .style('pointer-events', 'none')
      .text((d) => {
        const parts = d.name.split(' ');
        return parts[0];
      });

    // Secondary sub-label
    nodeGroups
      .append('text')
      .attr('x', 0)
      .attr('y', (d) => ((d.radius || 30) > 45 ? 20 : 16))
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', (d) => ((d.radius || 30) > 55 ? '10px' : '8.5px'))
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .text((d) => {
        const parts = d.name.split(' ');
        return parts.slice(1).join(' ') || `${d.turnoutPercentage}% Turnout`;
      });

    // Turnout / Votes info
    nodeGroups
      .filter((d) => (d.radius || 30) > 52)
      .append('text')
      .attr('x', 0)
      .attr('y', (d) => (d.radius || 30) * 0.58)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(148, 163, 184, 0.9)')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .style('pointer-events', 'none')
      .text((d) => `${(d.votesCast / 1000).toFixed(1)}k ballots`);

    // Simulation tick handler
    simulation.on('tick', () => {
      // Keep within bounds
      nodes.forEach((d) => {
        const r = d.radius || 30;
        d.x = Math.max(r + 10, Math.min(width - r - 10, d.x || width / 2));
        d.y = Math.max(r + 10, Math.min(height - r - 10, d.y || height / 2));
      });

      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Clean up simulation on unmount
    return () => {
      simulation.stop();
    };
  }, [filteredDistricts, dimensions, showTableView, simulationTriggerCount]);

  const handleSimulateAnomalyBurst = () => {
    setDistricts((prev) =>
      prev.map((d) => {
        if (d.id === 'dist-del-central' || d.id === 'dist-pun-east') {
          return {
            ...d,
            anomalyScore: Math.min(98, d.anomalyScore + 15),
            riskLevel: 'CRITICAL',
            flaggedIncidentsCount: d.flaggedIncidentsCount + 3,
            lastUpdated: 'Just now (Simulated Ingestion)',
          };
        }
        return d;
      })
    );
    setSimulationTriggerCount((c) => c + 1);
  };

  const handleResetScores = () => {
    setDistricts(INITIAL_DISTRICTS);
    setSimulationTriggerCount((c) => c + 1);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(79,209,255,0.25)]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Regional District Anomaly Detection Matrix</span>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
                  <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
                  D3 Dynamic Force Pack
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-signal behavioral risk scores, zero-knowledge consistency, and mempool arrival anomalies across {districts.length} electoral constituencies.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Stream Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Streaming Toggle */}
          <button
            id="toggle-live-anomaly-stream"
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle periodic live telemetry updates"
          >
            <Radio className={`h-3.5 w-3.5 ${isLiveStreaming ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>

          {/* Simulate Burst CTA */}
          <button
            id="simulate-anomaly-burst-button"
            type="button"
            onClick={handleSimulateAnomalyBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
            title="Simulate sudden anomaly score surge"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Simulate Anomaly Burst</span>
          </button>

          {/* Reset Baseline */}
          <button
            type="button"
            onClick={handleResetScores}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
            title="Reset telemetry to nominal baseline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Toggle Accessible Table */}
          <button
            id="toggle-bubble-table-view"
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showTableView
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>{showTableView ? 'Bubble Chart' : 'Data Table'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            id="district-anomaly-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district, state, or threat..."
            className="w-full rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Risk Level Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="h-3 w-3" />
            Risk:
          </span>
          {[
            { id: 'ALL', label: 'All Districts' },
            { id: 'LOW', label: 'Low (0-25)', color: 'text-cyan-400' },
            { id: 'MODERATE', label: 'Moderate (26-50)', color: 'text-amber-400' },
            { id: 'HIGH_CRITICAL', label: 'High & Critical (>50)', color: 'text-rose-400' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterLevel(pill.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterLevel === pill.id
                  ? 'bg-slate-800 text-white border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className={pill.color}>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Metric Mapping Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-400 font-semibold">Visual Dimensions:</span>
          <span className="text-slate-300 flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600 border border-slate-400 inline-block" />
            <span>Circle Area = Total Ballots Cast</span>
          </span>
          <span className="text-slate-300 flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
            <span>Outer Pulse Ring = Elevated Anomaly Risk</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Low (&lt;25)
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Moderate (26-50)
          </span>
          <span className="flex items-center gap-1 text-orange-300">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            High (51-75)
          </span>
          <span className="flex items-center gap-1 text-rose-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Critical (&gt;75)
          </span>
        </div>
      </div>

      {/* Main Visualizer Container */}
      {!showTableView ? (
        <div
          ref={containerRef}
          className="relative rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 p-2 overflow-hidden shadow-inner flex items-center justify-center min-h-[420px]"
        >
          {filteredDistricts.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Search className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No districts matched the filter criteria.</p>
              <button
                onClick={() => {
                  setFilterLevel('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-auto select-none"
              style={{ maxHeight: '520px' }}
            />
          )}

          {/* Hover Tooltip Overlay */}
          {hoveredDistrict && !selectedDistrict && (
            <div className="absolute top-4 right-4 z-20 pointer-events-none rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs w-64 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{hoveredDistrict.name}</h4>
                  <span className="text-[10px] text-slate-400">{hoveredDistrict.state}</span>
                </div>
                <span
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: getRiskStroke(hoveredDistrict.anomalyScore),
                    borderColor: getRiskColor(hoveredDistrict.anomalyScore, 0.4),
                    backgroundColor: getRiskColor(hoveredDistrict.anomalyScore, 0.15),
                  }}
                >
                  {hoveredDistrict.anomalyScore} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="text-slate-400">Ballots Cast:</div>
                <div className="font-mono font-semibold text-white text-right">
                  {hoveredDistrict.votesCast.toLocaleString()} ({hoveredDistrict.turnoutPercentage}%)
                </div>
                <div className="text-slate-400">Threat Vector:</div>
                <div className="font-semibold text-slate-200 text-right truncate" title={hoveredDistrict.primaryThreatVector}>
                  {hoveredDistrict.primaryThreatVector}
                </div>
                <div className="text-slate-400">Flagged Events:</div>
                <div className="font-mono font-bold text-right" style={{ color: getRiskStroke(hoveredDistrict.anomalyScore) }}>
                  {hoveredDistrict.flaggedIncidentsCount} incidents
                </div>
                <div className="text-slate-400">Consensus Rate:</div>
                <div className="font-mono text-emerald-400 text-right">{hoveredDistrict.consensusIntegrity}%</div>
              </div>

              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 text-center">
                Click bubble to inspect threat telemetry
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Data Table View (WCAG AA) */
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="p-3.5">District / Constituency</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5 text-right">Turnout / Electorate</th>
                <th className="p-3.5 text-center">Anomaly Score</th>
                <th className="p-3.5 text-center">Risk Tier</th>
                <th className="p-3.5">Primary Threat Vector</th>
                <th className="p-3.5 text-right">Sub-Stations</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredDistricts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3.5 font-sans font-bold text-white">{d.name}</td>
                  <td className="p-3.5 font-sans text-slate-400">{d.state}</td>
                  <td className="p-3.5 text-right text-slate-300">
                    {d.votesCast.toLocaleString()} / {d.totalVoters.toLocaleString()}{' '}
                    <span className="text-cyan-400">({d.turnoutPercentage}%)</span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px]"
                      style={{
                        color: getRiskStroke(d.anomalyScore),
                        backgroundColor: getRiskColor(d.anomalyScore, 0.15),
                      }}
                    >
                      {d.anomalyScore} / 100
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-sans font-bold text-[11px]">
                    <span
                      className={
                        d.riskLevel === 'CRITICAL'
                          ? 'text-rose-400'
                          : d.riskLevel === 'HIGH'
                          ? 'text-orange-400'
                          : d.riskLevel === 'MODERATE'
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }
                    >
                      {d.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5 font-sans text-slate-300 max-w-xs truncate" title={d.primaryThreatVector}>
                    {d.primaryThreatVector}
                  </td>
                  <td className="p-3.5 text-right text-slate-400">{d.subStationsCount} stations</td>
                  <td className="p-3.5 text-center font-sans">
                    <button
                      onClick={() => setSelectedDistrict(d)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected District Deep-Dive Drawer / Card */}
      {selectedDistrict && (
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm font-mono border"
                style={{
                  color: getRiskStroke(selectedDistrict.anomalyScore),
                  borderColor: getRiskColor(selectedDistrict.anomalyScore, 0.4),
                  backgroundColor: getRiskColor(selectedDistrict.anomalyScore, 0.15),
                }}
              >
                {selectedDistrict.anomalyScore}
              </div>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedDistrict.name} District Intelligence</span>
                  <span
                    className="text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase"
                    style={{
                      color: getRiskStroke(selectedDistrict.anomalyScore),
                      backgroundColor: getRiskColor(selectedDistrict.anomalyScore, 0.2),
                    }}
                  >
                    {selectedDistrict.riskLevel} ANOMALY
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedDistrict.state} • {selectedDistrict.subStationsCount} Connected Stations • Latency {selectedDistrict.networkLatencyMs}ms
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            {/* Primary Threat Attribution */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Primary Threat Factor
              </span>
              <p className="font-semibold text-white text-sm">{selectedDistrict.primaryThreatVector}</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {selectedDistrict.anomalyScore > 50
                  ? 'Behavioral heuristic algorithm flagged repetitive submissions with non-uniform entropy intervals.'
                  : 'All validator multi-signatures and zk-proof batches have validated against canonical block state.'}
              </p>
            </div>

            {/* Voter Participation & Turnout */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Electoral Volume
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registered Electors:</span>
                <span className="font-mono font-bold text-white">{selectedDistrict.totalVoters.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ballots Cast:</span>
                <span className="font-mono font-bold text-cyan-300">{selectedDistrict.votesCast.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">District Turnout:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedDistrict.turnoutPercentage}%</span>
              </div>
            </div>

            {/* Cryptographic Health & Consensus */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Node & Quorum Health
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Consensus Integrity:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedDistrict.consensusIntegrity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Flagged Incidents:</span>
                <span className="font-mono font-bold text-rose-400">{selectedDistrict.flaggedIncidentsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avg Sign Latency:</span>
                <span className="font-mono font-bold text-cyan-300">{selectedDistrict.networkLatencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* Action Recommendations for High Risk */}
          {selectedDistrict.anomalyScore > 50 && (
            <div className="mt-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-bold text-rose-200">Recommended Supervisory Intervention:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  Dispatch independent electoral audit team to {selectedDistrict.subStationsCount} polling stations in {selectedDistrict.name}. Enforce strict double-vote nullifier verification and enable secondary CAPTCHA / rate-limiting gates on the regional mempool ingress.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
