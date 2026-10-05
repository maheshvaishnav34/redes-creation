import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
  Sliders,
  ChevronDown,
  Building2,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const GeoGridPage = () => {
  const { activeBusiness } = useAuth();

  const [scan, setScan] = useState(null);
  const [points, setPoints] = useState([]);
  const [pastScans, setPastScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Scan Controls
  const [selectedKeyword, setSelectedKeyword] = useState('best fine dining restaurant ahmedabad');
  const [gridSize, setGridSize] = useState(5); // 3, 5, 7
  const [radiusKm, setRadiusKm] = useState(5.0); // 2.0, 5.0, 10.0
  const [selectedPoint, setSelectedPoint] = useState(null);

  const fetchScan = async () => {
    try {
      setLoading(true);
      const res = await api.getLatestGeoGrid();
      setScan(res.scan);
      setPoints(res.points || []);
      setPastScans(res.pastScans || []);
      if (res.points && res.points.length > 0) {
        setSelectedPoint(res.points[Math.floor(res.points.length / 2)]); // default center point
      }
      if (res.scan?.keyword) {
        setSelectedKeyword(res.scan.keyword);
      }
    } catch (err) {
      console.error('[GEO_GRID] Failed to load scan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
    const handleBizSwitch = () => fetchScan();
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  const handleRunNewScan = async () => {
    setScanning(true);
    try {
      const res = await api.runGeoGridScan({
        keyword: selectedKeyword,
        gridSize: parseInt(gridSize, 10),
        radiusKm: parseFloat(radiusKm)
      });
      setScan(res.scan);
      setPoints(res.points || []);
      if (res.points && res.points.length > 0) {
        setSelectedPoint(res.points[Math.floor(res.points.length / 2)]);
      }
      fetchScan();
    } catch (err) {
      console.error('[GEO_GRID] Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const getRankBadgeColor = (rank) => {
    if (rank <= 3) return 'bg-emerald-500 text-slate-950 font-black shadow-glow-emerald border-emerald-400';
    if (rank <= 10) return 'bg-amber-400 text-slate-950 font-bold border-amber-300';
    return 'bg-rose-500 text-white font-bold border-rose-400';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Scan Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Geo-Grid Local Rank Heatmap</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Hyper-Local Proximity Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates real-world GPS search rankings across Western Ahmedabad. Visualizes Google Local 3-Pack visibility drop-off over distance.
          </p>
        </div>

        {/* Scan Launcher Form */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <input
            type="text"
            value={selectedKeyword}
            onChange={(e) => setSelectedKeyword(e.target.value)}
            placeholder="Target Keyword..."
            className="px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          />

          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={3}>3x3 (9 pts)</option>
            <option value={5}>5x5 (25 pts)</option>
            <option value={7}>7x7 (49 pts)</option>
          </select>

          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={2.0}>2 km Radius</option>
            <option value={5.0}>5 km Radius</option>
            <option value={10.0}>10 km Radius</option>
          </select>

          <button
            onClick={handleRunNewScan}
            disabled={scanning}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-glow-brand flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Matrix...' : 'Run Scan'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">Target Keyword</span>
          <p className="text-sm font-bold text-white truncate mt-0.5">{scan?.keyword || selectedKeyword}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-400">3-Pack Visibility</span>
          <p className="text-xl font-extrabold text-white mt-0.5">{scan?.visibility_percentage || '78.4'}%</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-indigo-400">Average Rank</span>
          <p className="text-xl font-extrabold text-white mt-0.5">#{scan?.average_rank || '2.8'}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">Grid Dimensions</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">
            {scan?.grid_size || 5}x{scan?.grid_size || 5} ({scan?.radius_km || 5} km)
          </p>
        </div>
      </div>

      {/* Main Interactive Heatmap & Point Inspector Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap Matrix Board */}
        <div className="lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Heatmap Grid Visualizer ({activeBusiness?.city || 'Ahmedabad'})
              </span>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Top 3 (Dominant)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">Rank 4-10</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="text-slate-300">&gt; 10</span>
              </div>
            </div>
          </div>

          {/* Interactive Grid Cell Render */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 min-h-[300px] sm:min-h-[380px] overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-xs text-slate-400">Computing GPS geo-grid matrix...</span>
              </div>
            ) : (
              <div
                className="grid gap-1.5 sm:gap-3 w-full max-w-md mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${scan?.grid_size || gridSize}, minmax(0, 1fr))`
                }}
              >
                {points.map((pt, idx) => {
                  const isSelected = selectedPoint?.id === pt.id || (selectedPoint?.row === pt.row_idx && selectedPoint?.col === pt.col_idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPoint(pt)}
                      className={`
                        aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border-2 transition-all transform cursor-pointer relative cell-hover
                        ${getRankBadgeColor(pt.rank)}
                        ${isSelected ? 'ring-4 ring-indigo-400 scale-105 sm:scale-110 z-10' : 'hover:scale-105 opacity-90 hover:opacity-100'}
                      `}
                    >
                      <span className="text-xs sm:text-base md:text-lg font-black">{pt.rank}</span>
                      <span className="text-[7px] sm:text-[8px] md:text-[9px] uppercase font-bold tracking-tighter opacity-80 leading-none">
                        {pt.rank <= 3 ? '3-Pack' : `#${pt.rank}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            <span>Center Lat: {Number(activeBusiness?.latitude || 23.0373).toFixed(4)} | Lng: {Number(activeBusiness?.longitude || 72.5120).toFixed(4)}</span>
            <span>Click any coordinate pin to view competitors</span>
          </div>
        </div>

        {/* Pin Inspector Slide-Over Panel */}
        <div className="lg:col-span-4 p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Pin Coordinate Inspector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live competitive rankings for selected GPS point</p>
          </div>

          {selectedPoint ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Rank Here</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">#{selectedPoint.rank}</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {selectedPoint.rank <= 3 ? '✓ Visible in 3-Pack' : 'Below Fold'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Coordinates</span>
                  <span className="text-xs font-mono text-slate-300">
                    {Number(selectedPoint.lat).toFixed(4)}, {Number(selectedPoint.lng).toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Competitors Ranking At This Point */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Top Ranked on this Coordinate:</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-600/15 border border-indigo-500/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {selectedPoint.rank}
                      </span>
                      <span className="font-bold text-indigo-300">{activeBusiness?.name} (You)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Your Location</span>
                  </div>

                  {(selectedPoint.top_competitors || [
                    { name: 'Mirch Masala Dine', rank: 2 },
                    { name: 'Royal Treat Bistro', rank: 3 },
                    { name: 'The Grand Bhagwati', rank: 4 }
                  ]).map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-[10px]">
                          {comp.rank}
                        </span>
                        <span className="font-medium text-slate-200">{comp.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Competitor</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Advice */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Recommendation:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedPoint.rank > 3
                    ? 'Proximity drop-off detected. Boost citation density and add Bodakdev / Thaltej localized service mentions to expand the 3-Pack radius.'
                    : 'Strong dominance maintained at this pin. Continue gathering authentic reviews with localized photo tags to preserve position.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Click any coordinate cell in the heatmap grid to inspect local ranks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeoGridPage;
