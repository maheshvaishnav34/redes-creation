import { query } from '../../config/db.js';
import { logAudit } from '../../middleware/auditLogger.js';

export const getLatestScan = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.businessId;
    const { keywordId, scanId } = req.query;

    let scanRes;
    if (scanId) {
      scanRes = await query(`SELECT * FROM geo_grids WHERE id = $1 AND business_id = $2`, [scanId, businessId]);
    } else if (keywordId) {
      scanRes = await query(`SELECT * FROM geo_grids WHERE keyword_id = $1 AND business_id = $2 ORDER BY scan_date DESC LIMIT 1`, [keywordId, businessId]);
    } else {
      scanRes = await query(`SELECT * FROM geo_grids WHERE business_id = $1 ORDER BY scan_date DESC LIMIT 1`, [businessId]);
    }

    if (scanRes.rows.length === 0) {
      return res.json({ success: true, scan: null, points: [] });
    }

    const scan = scanRes.rows[0];
    const pointsRes = await query(
      `SELECT * FROM geo_grid_points WHERE geo_grid_id = $1 ORDER BY row_idx ASC, col_idx ASC`,
      [scan.id]
    );

    // List of past scans for selector
    const pastScans = await query(
      `SELECT id, keyword, grid_size, radius_km, visibility_percentage, average_rank, scan_date
       FROM geo_grids
       WHERE business_id = $1
       ORDER BY scan_date DESC LIMIT 10`,
      [businessId]
    );

    res.json({
      success: true,
      scan,
      points: pointsRes.rows,
      pastScans: pastScans.rows
    });
  } catch (err) {
    next(err);
  }
};

export const runNewScan = async (req, res, next) => {
  try {
    const businessId = req.body.businessId || req.businessId;
    const { keyword, keywordId, gridSize = 5, radiusKm = 5.0 } = req.body;

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword is required for geo-grid scan' });
    }

    // Get business center coordinates
    const bizRes = await query(`SELECT latitude, longitude, name FROM business_locations WHERE id = $1`, [businessId]);
    const biz = bizRes.rows[0];
    const centerLat = Number(biz?.latitude || 23.0373);
    const centerLng = Number(biz?.longitude || 72.5120);

    const stepKm = (radiusKm * 2) / (gridSize - 1);
    // 1 deg lat is approx 111km, 1 deg lng is approx 102km in India
    const latDelta = stepKm / 111.0;
    const lngDelta = stepKm / 102.0;

    let totalRank = 0;
    let top3Count = 0;
    const pointsToInsert = [];

    const competitorsSample = [
      { name: 'Mirch Masala Dine', rank: 2 },
      { name: 'Royal Treat Bistro', rank: 3 },
      { name: 'The Grand Bhagwati', rank: 4 }
    ];

    // Generate grid matrix
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const offsetR = r - Math.floor(gridSize / 2);
        const offsetC = c - Math.floor(gridSize / 2);
        const ptLat = centerLat + offsetR * latDelta;
        const ptLng = centerLng + offsetC * lngDelta;

        // Realistic rank based on distance from center
        const distFromCenter = Math.sqrt(offsetR * offsetR + offsetC * offsetC);
        const rank = Math.min(15, Math.max(1, Math.round(1 + distFromCenter * 1.6 + (Math.random() - 0.5) * 1.5)));

        totalRank += rank;
        if (rank <= 3) top3Count++;

        pointsToInsert.push({
          row: r,
          col: c,
          lat: ptLat,
          lng: ptLng,
          rank,
          competitors: competitorsSample
        });
      }
    }

    const totalPoints = gridSize * gridSize;
    const avgRank = (totalRank / totalPoints).toFixed(1);
    const visibilityPct = ((top3Count / totalPoints) * 100).toFixed(1);

    const scanInsert = await query(
      `INSERT INTO geo_grids (
         business_id, keyword_id, keyword, grid_size, radius_km, center_lat, center_lng,
         visibility_percentage, average_rank, scan_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [businessId, keywordId || null, keyword, gridSize, radiusKm, centerLat, centerLng, visibilityPct, avgRank]
    );

    const newScanId = scanInsert.rows[0].id;

    for (const pt of pointsToInsert) {
      await query(
        `INSERT INTO geo_grid_points (geo_grid_id, row_idx, col_idx, lat, lng, rank, top_competitors, is_ranking)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [newScanId, pt.row, pt.col, pt.lat, pt.lng, pt.rank, JSON.stringify(pt.competitors)]
      );
    }

    // Record job execution
    await query(
      `INSERT INTO system_jobs (job_type, status, items_processed, details)
       VALUES ('geo_grid_scan', 'completed', $1, $2)`,
      [totalPoints, JSON.stringify({ keyword, scanId: newScanId, visibilityPct, avgRank })]
    );

    await logAudit(req.workspaceId, req.user.id, 'GEO_GRID_SCAN_RUN', 'geo_grids', newScanId, { keyword, gridSize, radiusKm });

    res.status(201).json({
      success: true,
      scan: scanInsert.rows[0],
      points: pointsToInsert
    });
  } catch (err) {
    next(err);
  }
};
