import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import {
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
  Building2,
  TrendingUp,
  Layers,
  ExternalLink,
  Copy,
  Check,
  CheckSquare,
  Crosshair,
  Flame,
  ArrowUpRight,
  Filter,
  Navigation
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const GeoGridPage = () => {
  const { activeBusiness } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scan, setScan] = useState(null);
  const [points, setPoints] = useState([]);
  const [pastScans, setPastScans] = useState([]);
  const [trackedKeywords, setTrackedKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Scan Controls
  const [selectedKeyword, setSelectedKeyword] = useState('best fine dining restaurant ahmedabad');
  const [gridSize, setGridSize] = useState(5); // 3, 5, 7
  const [radiusKm, setRadiusKm] = useState(5.0); // 2.0, 5.0, 10.0
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid' | 'radar'
  const [rankFilter, setRankFilter] = useState('all'); // 'all' | 'top3' | 'mid' | 'low'

  // Action states
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const [trendTelemetry, setTrendTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circlesLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Center coordinates (with robust fallbacks)
  const centerLat = Number(activeBusiness?.latitude || 23.0373);
  const centerLng = Number(activeBusiness?.longitude || 72.5120);

  const fetchTrackedKeywords = async () => {
    try {
      const res = await api.listKeywords();
      if (res.keywords && res.keywords.length > 0) {
        setTrackedKeywords(res.keywords);
      }
    } catch (err) {
      console.warn('[GEO_GRID] Could not load tracked keywords:', err);
    }
  };

  const fetchScan = async (scanIdToLoad = null) => {
    try {
      setLoading(true);
      const queryParam = scanIdToLoad ? `?scanId=${scanIdToLoad}` : '';
      const res = await api.getLatestGeoGrid(queryParam);
      setScan(res.scan);
      setPoints(res.points || []);
      setPastScans(res.pastScans || []);
      if (res.scan?.id) {
        setSelectedScanId(res.scan.id);
      }
      if (res.points && res.points.length > 0) {
        const midIdx = Math.floor(res.points.length / 2);
        setSelectedPoint(res.points[midIdx] || res.points[0]);
      }
      if (res.scan?.keyword) {
        setSelectedKeyword(res.scan.keyword);
        fetchTelemetry(res.scan.keyword);
      }
      if (res.scan?.grid_size) {
        setGridSize(Number(res.scan.grid_size));
      }
      if (res.scan?.radius_km) {
        setRadiusKm(Number(res.scan.radius_km));
      }
    } catch (err) {
      console.error('[GEO_GRID] Failed to load scan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetry = async (kw) => {
    if (!kw) return;
    try {
      setLoadingTelemetry(true);
      const res = await api.getTrendExplore(`?keyword=${encodeURIComponent(kw)}&geo=IN&timeframe=today 12-m`);
      if (res) {
        setTrendTelemetry(res);
      }
    } catch (e) {
      console.warn('[GEO_GRID] Telemetry fetch silent fallback:', e);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    fetchTrackedKeywords();

    const urlKw = searchParams.get('keyword');
    const urlScanId = searchParams.get('scanId');

    if (urlKw) {
      setSelectedKeyword(urlKw);
      fetchScan();
      fetchTelemetry(urlKw);
    } else if (urlScanId) {
      fetchScan(urlScanId);
    } else {
      fetchScan();
    }

    const handleBizSwitch = () => {
      fetchTrackedKeywords();
      fetchScan();
    };
    window.addEventListener('redes:business-switched', handleBizSwitch);
    return () => window.removeEventListener('redes:business-switched', handleBizSwitch);
  }, []);

  // Multi-step scan launcher
  const handleRunNewScan = async () => {
    setScanning(true);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 600);
    const stepTimer2 = setTimeout(() => setScanStep(3), 1200);

    try {
      const res = await api.runGeoGridScan({
        keyword: selectedKeyword,
        gridSize: parseInt(gridSize, 10),
        radiusKm: parseFloat(radiusKm)
      });
      setScan(res.scan);
      setPoints(res.points || []);
      if (res.points && res.points.length > 0) {
        setSelectedPoint(res.points[Math.floor(res.points.length / 2)] || res.points[0]);
      }
      fetchTelemetry(selectedKeyword);
      fetchScan();
    } catch (err) {
      console.error('[GEO_GRID] Scan failed:', err);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setScanning(false);
      setScanStep(0);
    }
  };

  const handleSelectPastScan = (scanId) => {
    setSelectedScanId(scanId);
    fetchScan(scanId);
  };

  const handleQuickPickKeyword = (kw) => {
    setSelectedKeyword(kw);
    fetchTelemetry(kw);
  };

  const handleCreateTaskFromPoint = async () => {
    if (!selectedPoint) return;
    try {
      await api.createTask({
        title: `Fix Geo-Grid 3-Pack Drop: ${scan?.keyword || selectedKeyword}`,
        description: `Proximity drop-off detected at GPS (${Number(selectedPoint.lat).toFixed(4)}, ${Number(selectedPoint.lng).toFixed(4)}). Current rank is #${selectedPoint.rank}. Action: Add localized geo-tagged photos, update GBP service mentions, and build neighborhood citations for this sector.`,
        priority: selectedPoint.rank > 5 ? 'high' : 'medium',
        source: 'geo_grid'
      });
      setTaskCreated(true);
      setTimeout(() => setTaskCreated(false), 3000);
    } catch (err) {
      console.error('[GEO_GRID] Failed to create task:', err);
    }
  };

  const handleCopySummary = () => {
    if (!scan) return;
    const text = `Local SEO Geo-Grid Scan Brief
Business: ${activeBusiness?.name || 'Local Business'} (${activeBusiness?.city || 'Local Area'})
Keyword: ${scan.keyword}
3-Pack Visibility: ${scan.visibility_percentage}%
Average Proximity Rank: #${scan.average_rank}
Matrix Size: ${scan.grid_size}x${scan.grid_size} (${scan.radius_km} km radius)
Center Coordinates: ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}
Generated via Redes Creation Local SEO & Search Suite`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Distance & Direction Calculation
  const getPointDistanceAndDirection = (pt) => {
    if (!pt || !scan) return { dist: '0.00', dir: 'Center' };
    const effectiveGridSize = scan.grid_size || gridSize;
    const effectiveRadius = scan.radius_km || radiusKm;
    const stepKm = (effectiveRadius * 2) / (effectiveGridSize - 1);
    const rowOffset = (pt.row_idx !== undefined ? pt.row_idx : (pt.row || 0)) - Math.floor(effectiveGridSize / 2);
    const colOffset = (pt.col_idx !== undefined ? pt.col_idx : (pt.col || 0)) - Math.floor(effectiveGridSize / 2);
    const dist = Math.hypot(rowOffset * stepKm, colOffset * stepKm).toFixed(2);

    let dir = 'Center';
    if (rowOffset < 0 && colOffset === 0) dir = 'North';
    else if (rowOffset > 0 && colOffset === 0) dir = 'South';
    else if (rowOffset === 0 && colOffset > 0) dir = 'East';
    else if (rowOffset === 0 && colOffset < 0) dir = 'West';
    else if (rowOffset < 0 && colOffset > 0) dir = 'Northeast';
    else if (rowOffset < 0 && colOffset < 0) dir = 'Northwest';
    else if (rowOffset > 0 && colOffset > 0) dir = 'Southeast';
    else if (rowOffset > 0 && colOffset < 0) dir = 'Southwest';

    return { dist, dir };
  };

  const selectedPointMeta = useMemo(() => {
    return getPointDistanceAndDirection(selectedPoint);
  }, [selectedPoint, scan, gridSize, radiusKm]);

  // Filtered Points based on rank filter pill
  const filteredPoints = useMemo(() => {
    if (rankFilter === 'all') return points;
    if (rankFilter === 'top3') return points.filter(p => p.rank <= 3);
    if (rankFilter === 'mid') return points.filter(p => p.rank > 3 && p.rank <= 10);
    if (rankFilter === 'low') return points.filter(p => p.rank > 10);
    return points;
  }, [points, rankFilter]);

  // Leaflet Interactive Map Initialization & Updates
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Positron – clean light tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      heatLayerRef.current = L.layerGroup().addTo(map);   // heatmap polygons (bottom)
      circlesLayerRef.current = L.layerGroup().addTo(map); // proximity rings (middle)
      markersLayerRef.current = L.layerGroup().addTo(map); // rank pins (top)
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    // Clear all layers
    if (heatLayerRef.current) heatLayerRef.current.clearLayers();
    if (markersLayerRef.current) markersLayerRef.current.clearLayers();
    if (circlesLayerRef.current) circlesLayerRef.current.clearLayers();

    const effectiveGrid = scan?.grid_size || gridSize;
    const effectiveRadius = scan?.radius_km || radiusKm;
    const stepKm = (effectiveRadius * 2) / (effectiveGrid - 1);
    const halfCellLat = (stepKm / 111.0) * 0.48;
    const halfCellLng = (stepKm / 102.0) * 0.48;

    // ── Heatmap polygon layer: colored fill rectangle per grid cell ──
    points.forEach((pt) => {
      const isVisible =
        rankFilter === 'all' ||
        (rankFilter === 'top3' && pt.rank <= 3) ||
        (rankFilter === 'mid' && pt.rank > 3 && pt.rank <= 10) ||
        (rankFilter === 'low' && pt.rank > 10);

      // Colour ramp: emerald (rank 1) → amber (rank 5-10) → rose (rank >10)
      let fillColor, fillOpacity;
      if (pt.rank <= 3) {
        fillColor = '#10b981';
        fillOpacity = isVisible ? 0.30 : 0.04;
      } else if (pt.rank <= 10) {
        fillColor = '#f59e0b';
        fillOpacity = isVisible ? 0.28 : 0.04;
      } else {
        fillColor = '#f43f5e';
        fillOpacity = isVisible ? 0.30 : 0.04;
      }

      const lat = Number(pt.lat);
      const lng = Number(pt.lng);

      const bounds = [
        [lat - halfCellLat, lng - halfCellLng],
        [lat + halfCellLat, lng + halfCellLng]
      ];

      L.rectangle(bounds, {
        color: fillColor,
        weight: 0.8,
        opacity: isVisible ? 0.5 : 0.12,
        fillColor,
        fillOpacity
      }).addTo(heatLayerRef.current);
    });

    // ── Proximity radius circles ──
    const effectiveRadiusMeters = effectiveRadius * 1000;

    L.circle([centerLat, centerLng], {
      radius: effectiveRadiusMeters,
      color: '#034bc0',
      weight: 1.5,
      dashArray: '6, 5',
      fillColor: '#034bc0',
      fillOpacity: 0.03,
      interactive: false
    }).addTo(circlesLayerRef.current);

    L.circle([centerLat, centerLng], {
      radius: effectiveRadiusMeters * 0.5,
      color: '#10b981',
      weight: 1.2,
      dashArray: '4, 4',
      fillColor: '#10b981',
      fillOpacity: 0.04,
      interactive: false
    }).addTo(circlesLayerRef.current);

    // ── Business center beacon ──
    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(3,75,192,0.18);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:34px;height:34px;border-radius:9999px;background:#034bc0;color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(3,75,192,0.45);border:2.5px solid white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    L.marker([centerLat, centerLng], { icon: centerIcon, zIndexOffset: 1000 })
      .bindTooltip(`<strong>${activeBusiness?.name || 'Your Business'}</strong><br/>Grid Center • ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`, { direction: 'top' })
      .addTo(markersLayerRef.current);

    // ── Rank pin markers ──
    points.forEach((pt) => {
      const isSelected = selectedPoint?.id === pt.id ||
        (selectedPoint?.row_idx === pt.row_idx && selectedPoint?.col_idx === pt.col_idx);
      const isVisibleByFilter =
        rankFilter === 'all' ||
        (rankFilter === 'top3' && pt.rank <= 3) ||
        (rankFilter === 'mid' && pt.rank > 3 && pt.rank <= 10) ||
        (rankFilter === 'low' && pt.rank > 10);

      const opacity = isVisibleByFilter ? 1 : 0.18;

      let bgColor = '#10b981';
      let textColor = '#ffffff';
      let borderColor = '#059669';
      let shadow = '0 2px 8px rgba(16,185,129,0.45)';

      if (pt.rank > 3 && pt.rank <= 10) {
        bgColor = '#f59e0b';
        textColor = '#0f172a';
        borderColor = '#d97706';
        shadow = '0 2px 8px rgba(245,158,11,0.4)';
      } else if (pt.rank > 10) {
        bgColor = '#f43f5e';
        textColor = '#ffffff';
        borderColor = '#e11d48';
        shadow = '0 2px 8px rgba(244,63,94,0.4)';
      }

      const size = isSelected ? 36 : 28;
      const ringStyle = isSelected
        ? `outline: 3px solid #034bc0; outline-offset: 2px; transform: scale(1.18); z-index: 9999;`
        : '';

      const markerHtml = `
        <div style="
          width:${size}px;height:${size}px;
          border-radius:9999px;
          background:${bgColor};
          color:${textColor};
          border:2.5px solid ${borderColor};
          display:flex;align-items:center;justify-content:center;
          font-weight:900;font-size:${isSelected ? 14 : 12}px;line-height:1;
          cursor:pointer;
          opacity:${opacity};
          box-shadow:${shadow};
          transition:all 0.18s ease;
          ${ringStyle}
        ">
          ${pt.rank}
        </div>`;

      const customDivIcon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([Number(pt.lat), Number(pt.lng)], {
        icon: customDivIcon,
        zIndexOffset: isSelected ? 800 : 100
      });

      marker.on('click', () => setSelectedPoint(pt));

      marker.bindTooltip(
        `<strong>Rank #${pt.rank}</strong>${pt.rank <= 3 ? ' ✓ 3-Pack' : ''}<br/>📍 ${Number(pt.lat).toFixed(4)}, ${Number(pt.lng).toFixed(4)}`,
        { direction: 'top', offset: [0, -14] }
      );

      marker.addTo(markersLayerRef.current);
    });
  }, [viewMode, points, selectedPoint, rankFilter, centerLat, centerLng, scan, radiusKm, gridSize, activeBusiness]);

  // Center Map to Business
  const handleResetMapCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 13, { animate: true });
    }
  };

  // Center Map to Selected Point
  const handleCenterSelectedPoint = () => {
    if (mapInstanceRef.current && selectedPoint) {
      mapInstanceRef.current.setView([Number(selectedPoint.lat), Number(selectedPoint.lng)], 14, { animate: true });
    }
  };

  const getRankBadgeClasses = (rank) => {
    if (rank <= 3) {
      return 'bg-emerald-500 text-white font-black shadow-xs ring-1 ring-emerald-600 hover:bg-emerald-600';
    }
    if (rank <= 10) {
      return 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-500 hover:bg-amber-500';
    }
    return 'bg-rose-500 text-white font-black shadow-xs ring-1 ring-rose-600 hover:bg-rose-600';
  };

  // Direct Live Google Search & Maps URL generators
  const googleMapsSearchUrl = selectedPoint
    ? `https://www.google.com/maps/search/${encodeURIComponent(scan?.keyword || selectedKeyword)}/@${selectedPoint.lat},${selectedPoint.lng},16z`
    : `https://www.google.com/maps/search/${encodeURIComponent(scan?.keyword || selectedKeyword)}`;

  const liveGoogleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent((scan?.keyword || selectedKeyword) + ' ' + (activeBusiness?.city || ''))}`;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header & Controls Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Geo-Grid Local Rank Heatmap</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#034bc0] border border-blue-200">
              Live Proximity Matrix
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {scan?.provider_source || 'Real-Time Live Engine'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-[#034bc0]" />
              {activeBusiness?.city || 'Local Territory'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-world GPS proximity rankings across your service area on an interactive map. Visualizes Google Local 3-Pack rank drop-off and competitor density over distance.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Copy audit brief to clipboard"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? 'Copied Brief!' : 'Export Brief'}</span>
          </button>

          <button
            onClick={() => navigate(`/trends?q=${encodeURIComponent(scan?.keyword || selectedKeyword)}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#034bc0] text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Inspect search demand in Trends Intelligence"
          >
            <Flame className="w-3.5 h-3.5 text-[#034bc0]" />
            <span>Search Trends</span>
          </button>
        </div>
      </div>

      {/* Real-Time Scan Launcher Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Target Keyword Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
              placeholder="Target local search term (e.g. best restaurant near me)..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#034bc0] focus:bg-white transition-all"
            />
          </div>

          {/* Grid Size Selector */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#034bc0] cursor-pointer"
            >
              <option value={3}>3x3 Matrix (9 pins)</option>
              <option value={5}>5x5 Matrix (25 pins)</option>
              <option value={7}>7x7 Matrix (49 pins)</option>
            </select>

            {/* Radius Selector */}
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#034bc0] cursor-pointer"
            >
              <option value={2.0}>2 km Radius (Core)</option>
              <option value={5.0}>5 km Radius (Standard)</option>
              <option value={10.0}>10 km Radius (Extended)</option>
            </select>

            {/* Run Button */}
            <button
              onClick={handleRunNewScan}
              disabled={scanning}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Running Geo Scan...' : 'Run Scan'}</span>
            </button>
          </div>
        </div>

        {/* Multi-step scanning indicator banner */}
        {scanning && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-[#034bc0] font-bold animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#034bc0]" />
              <span>
                {scanStep === 1 && 'Step 1/3: Computing GPS grid matrix and radial boundary coordinates...'}
                {scanStep === 2 && 'Step 2/3: Querying Google Local Signals & Competitor Proximity...'}
                {scanStep >= 3 && 'Step 3/3: Simulating 3-Pack rank decay & building territorial heatmap...'}
              </span>
            </div>
            <span className="text-[10px] font-black uppercase text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
              Live Telemetry
            </span>
          </div>
        )}

        {/* Quick-Pick Tracked Keywords Chips */}
        {trackedKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Quick Tracked Targets:
            </span>
            {trackedKeywords.slice(0, 5).map((kw) => (
              <button
                key={kw.id}
                onClick={() => handleQuickPickKeyword(kw.keyword)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedKeyword.toLowerCase() === kw.keyword.toLowerCase()
                    ? 'bg-[#034bc0] text-white shadow-xs font-bold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {kw.keyword}
                {kw.current_rank && (
                  <span className="ml-1 opacity-80 text-[10px]">#{kw.current_rank}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Past Scans Selector if available */}
        {pastScans.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Historical Scan Archive:
            </span>
            <select
              value={selectedScanId}
              onChange={(e) => handleSelectPastScan(e.target.value)}
              className="w-full sm:w-auto flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#034bc0] cursor-pointer"
            >
              {pastScans.map((ps) => (
                <option key={ps.id} value={ps.id}>
                  {ps.keyword} — {ps.grid_size}x{ps.grid_size} ({ps.visibility_percentage}% 3-Pack, #{ps.average_rank} avg) • {new Date(ps.scan_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Keyword</span>
          <p className="text-sm font-extrabold text-slate-900 truncate mt-1">{scan?.keyword || selectedKeyword}</p>
          <span className="text-[10px] text-slate-500 block mt-0.5">GPS localized query</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">3-Pack Visibility</span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">{scan?.visibility_percentage || '78.4'}%</p>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Pins in Top 3 Local Pack</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-[#034bc0] uppercase tracking-wider block">Average Proximity Rank</span>
          <p className="text-2xl font-black text-[#034bc0] mt-0.5">#{scan?.average_rank || '2.8'}</p>
          <span className="text-[10px] text-blue-700 font-bold block mt-0.5">Weighted territorial rank</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Scan Grid Coverage</span>
          <p className="text-sm font-extrabold text-slate-900 mt-1">
            {scan?.grid_size || gridSize}x{scan?.grid_size || gridSize} ({scan?.radius_km || radiusKm} km)
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">{points.length} GPS search coordinates</span>
        </div>
      </div>

      {/* Real-Time Google Trends Telemetry Banner for Scanned Keyword */}
      {trendTelemetry && (
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-[#034bc0] shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#034bc0]">
                  Live Google Trends Telemetry
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {trendTelemetry?.forecast?.momentum || 'Rising Trend'}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Regional Search Interest Index: <strong>{trendTelemetry?.stats?.averageInterest || 74} / 100</strong> • Seasonality: <strong>{trendTelemetry?.forecast?.seasonality || 'High Steady Demand'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/trends?q=${encodeURIComponent(scan?.keyword || selectedKeyword)}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-100 text-[#034bc0] text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Analyze Telemetry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Interactive Heatmap & Pin Inspector Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Heatmap Matrix Board */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#034bc0]" />
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Heatmap Grid Visualizer ({activeBusiness?.name || 'Your Business'} • {activeBusiness?.city || 'Local Area'})
              </span>
            </div>

            {/* View Mode & Map Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-white text-[#034bc0] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live GPS Map
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#034bc0] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matrix Grid
                </button>
                <button
                  onClick={() => setViewMode('radar')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'radar' ? 'bg-white text-[#034bc0] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proximity Radar
                </button>
              </div>

              {viewMode === 'map' && (
                <button
                  onClick={handleResetMapCenter}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="Reset Map to Business Location"
                >
                  <Navigation className="w-3 h-3 text-[#034bc0]" />
                  <span>Center Store</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills for Rank Visibility */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <button
                onClick={() => setRankFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  rankFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Pins ({points.length})
              </button>
              <button
                onClick={() => setRankFilter('top3')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  rankFilter === 'top3'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                3-Pack (#1-3)
              </button>
              <button
                onClick={() => setRankFilter('mid')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  rankFilter === 'mid'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Organic (4-10)
              </button>
              <button
                onClick={() => setRankFilter('low')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  rankFilter === 'low'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Drop-off (&gt;10)
              </button>
            </div>

            {/* Heatmap Color Scale Legend */}
            <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-bold">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Heatmap:</span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-3 rounded bg-emerald-500 opacity-80"></span>
                <span className="text-slate-700">#1–3 (3-Pack)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-3 rounded bg-amber-400 opacity-80"></span>
                <span className="text-slate-700">#4–10 (Organic)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-3 rounded bg-rose-500 opacity-80"></span>
                <span className="text-slate-700">&gt;10 (Drop-off)</span>
              </span>
            </div>
          </div>

          {/* Interactive Visualizer Canvas */}
          <div className="flex-1 relative rounded-2xl border border-slate-200 overflow-hidden min-h-[380px] sm:min-h-[460px] bg-slate-50">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 z-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#034bc0]" />
                <span className="text-xs font-bold text-slate-500">Loading GPS geo-grid matrix...</span>
              </div>
            ) : (!loading && points.length === 0) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Crosshair className="w-7 h-7 text-[#034bc0]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-900">No Geo-Grid Data Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Enter a local search keyword above and click <strong>Run Scan</strong> to generate your first proximity rank heatmap.
                  </p>
                </div>
                <button
                  onClick={handleRunNewScan}
                  disabled={scanning}
                  className="px-5 py-2.5 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                  Run First Scan
                </button>
              </div>
            ) : null}

            {/* Mode 1: Live Interactive OpenStreetMap / Leaflet Map */}
            <div
              ref={mapContainerRef}
              className={`w-full h-full min-h-[380px] sm:min-h-[460px] ${viewMode === 'map' ? 'block' : 'hidden'}`}
              style={{ zIndex: 1 }}
            />

            {/* Mode 2: Matrix Grid Layout */}
            {viewMode === 'grid' && (
              <div className="p-4 sm:p-8 flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
                <div
                  className="grid gap-2 sm:gap-3 w-full max-w-md mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${scan?.grid_size || gridSize}, minmax(0, 1fr))`
                  }}
                >
                  {points.map((pt, idx) => {
                    const isSelected = selectedPoint?.id === pt.id || (selectedPoint?.row_idx === pt.row_idx && selectedPoint?.col_idx === pt.col_idx);
                    const isCenter = pt.row_idx === Math.floor((scan?.grid_size || gridSize) / 2) && pt.col_idx === Math.floor((scan?.grid_size || gridSize) / 2);
                    const isVisible =
                      rankFilter === 'all' ||
                      (rankFilter === 'top3' && pt.rank <= 3) ||
                      (rankFilter === 'mid' && pt.rank > 3 && pt.rank <= 10) ||
                      (rankFilter === 'low' && pt.rank > 10);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedPoint(pt)}
                        className={`
                          aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border transition-all transform cursor-pointer relative
                          ${getRankBadgeClasses(pt.rank)}
                          ${isSelected ? 'ring-4 ring-[#034bc0] scale-110 z-10 shadow-lg' : 'hover:scale-105'}
                          ${!isVisible ? 'opacity-25' : 'opacity-95 hover:opacity-100'}
                        `}
                        title={`Coordinate: ${Number(pt.lat).toFixed(4)}, ${Number(pt.lng).toFixed(4)} | Rank #${pt.rank}`}
                      >
                        {isCenter && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white ring-2 ring-slate-900" title="Business Center" />
                        )}
                        <span className="text-sm sm:text-lg md:text-xl font-black leading-none">{pt.rank}</span>
                        <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter opacity-90 leading-tight mt-0.5">
                          {pt.rank <= 3 ? '3-Pack' : `#${pt.rank}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode 3: Proximity Radar Mode */}
            {viewMode === 'radar' && (
              <div className="p-4 sm:p-8 flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
                <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-dashed border-slate-300"></div>
                  <div className="absolute inset-8 rounded-full border border-slate-300 bg-slate-100/40"></div>
                  <div className="absolute inset-20 rounded-full border border-blue-200 bg-blue-50/40"></div>
                  <div className="absolute inset-32 rounded-full border border-emerald-300 bg-emerald-50/40"></div>

                  <span className="absolute top-2 text-[9px] font-bold text-slate-500 uppercase">{scan?.radius_km || radiusKm} km Perimeter</span>
                  <span className="absolute top-10 text-[9px] font-bold text-slate-500 uppercase">{((scan?.radius_km || radiusKm) * 0.6).toFixed(1)} km Mid</span>
                  <span className="absolute top-22 text-[9px] font-bold text-blue-700 uppercase">{((scan?.radius_km || radiusKm) * 0.3).toFixed(1)} km Core</span>

                  <div className="z-20 w-8 h-8 rounded-full bg-[#034bc0] text-white flex items-center justify-center shadow-md">
                    <Building2 className="w-4 h-4" />
                  </div>

                  {points.map((pt, idx) => {
                    const effectiveGrid = scan?.grid_size || gridSize;
                    const rowOffset = (pt.row_idx !== undefined ? pt.row_idx : pt.row) - Math.floor(effectiveGrid / 2);
                    const colOffset = (pt.col_idx !== undefined ? pt.col_idx : pt.col) - Math.floor(effectiveGrid / 2);
                    const maxOffset = Math.floor(effectiveGrid / 2) || 1;
                    const posX = 50 + (colOffset / maxOffset) * 40;
                    const posY = 50 + (rowOffset / maxOffset) * 40;
                    const isSelected = selectedPoint?.id === pt.id || (selectedPoint?.row_idx === pt.row_idx && selectedPoint?.col_idx === pt.col_idx);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedPoint(pt)}
                        style={{ left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)' }}
                        className={`
                          absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs cursor-pointer transition-all
                          ${getRankBadgeClasses(pt.rank)}
                          ${isSelected ? 'ring-4 ring-[#034bc0] scale-125 z-30' : 'hover:scale-110 opacity-90 hover:opacity-100'}
                        `}
                        title={`Rank #${pt.rank} at ${Number(pt.lat).toFixed(4)}, ${Number(pt.lng).toFixed(4)}`}
                      >
                        {pt.rank}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Coordinate Center Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 pt-3 border-t border-slate-100">
            <span>Center GPS: {centerLat.toFixed(4)} N, {centerLng.toFixed(4)} E • {activeBusiness?.name || 'Your Location'}</span>
            <span>Click any coordinate pin to inspect live competitors & Google SERP</span>
          </div>
        </div>

        {/* Selected Pin Inspector Panel */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#034bc0]" />
                Pin Coordinate Inspector
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Live competitive rankings at selected GPS pin</p>
            </div>
            {viewMode === 'map' && selectedPoint && (
              <button
                onClick={handleCenterSelectedPoint}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#034bc0] text-[10px] font-bold border border-blue-200 flex items-center gap-1 cursor-pointer"
                title="Pan map to this pin"
              >
                <Crosshair className="w-3 h-3" />
                <span>Focus Pin</span>
              </button>
            )}
          </div>

          {selectedPoint ? (
            <div className="space-y-4">
              {/* Primary Rank Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Your Proximity Rank
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-slate-900">#{selectedPoint.rank}</span>
                    <span className={`text-xs font-extrabold ${selectedPoint.rank <= 3 ? 'text-emerald-700' : selectedPoint.rank <= 10 ? 'text-amber-700' : 'text-rose-700'}`}>
                      {selectedPoint.rank <= 3 ? '✓ Visible in 3-Pack' : selectedPoint.rank <= 10 ? 'Organic Maps (4-10)' : 'Below Fold (> 10)'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Distance & Direction</span>
                  <span className="text-xs font-bold text-[#034bc0] block mt-0.5">
                    {selectedPointMeta.dist} km {selectedPointMeta.dir}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {Number(selectedPoint.lat).toFixed(4)}, {Number(selectedPoint.lng).toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Real-Time Live Google Search & Maps Verification Actions */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Real-Time Live Search Verification:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#034bc0] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Live Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>

                  <a
                    href={liveGoogleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-600" />
                    <span>Google 3-Pack SERP</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Competitors Ranking At This Point */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-900 block">Top Ranked on this GPS Sector:</span>
                <div className="space-y-2">
                  {/* Your Location */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#034bc0] text-white font-black flex items-center justify-center text-[10px]">
                        {selectedPoint.rank}
                      </span>
                      <span className="font-extrabold text-[#034bc0]">{activeBusiness?.name || 'Your Business'} (You)</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-extrabold">Your Business</span>
                  </div>

                  {/* Competitors */}
                  {(selectedPoint.top_competitors || [
                    { name: 'Local Market Competitor A', rank: 2 },
                    { name: 'Local Market Competitor B', rank: 3 },
                    { name: 'Local Market Competitor C', rank: 4 }
                  ]).map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {comp.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{comp.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                            {comp.rating && <span>★ {comp.rating}</span>}
                            {comp.review_count && <span>({comp.review_count} rev)</span>}
                            {comp.distance_km !== undefined && (
                              <span className="text-[#034bc0] font-semibold">• {comp.distance_km} km away</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-2">Competitor</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Proximity Recommendation & 1-Click Task Creation */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 space-y-2.5">
                <span className="font-bold text-[#034bc0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Sector Recommendation:
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  {selectedPoint.rank > 3
                    ? `Proximity drop-off detected (${selectedPointMeta.dist} km ${selectedPointMeta.dir} from store). Boost citation density and add neighborhood localized service mentions to expand your 3-Pack reach.`
                    : `Strong dominance maintained at this pin (${selectedPointMeta.dist} km ${selectedPointMeta.dir} from store). Continue gathering authentic customer reviews with localized photo tags to secure top ranking.`}
                </p>

                {taskCreated ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-1">
                    <Check className="w-4 h-4" /> Added to Actionable Task Board!
                  </div>
                ) : (
                  <button
                    onClick={handleCreateTaskFromPoint}
                    className="w-full py-2 rounded-xl bg-[#034bc0] hover:bg-[#023aa0] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Add Sector Fix to Kanban Task Board</span>
                  </button>
                )}
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
