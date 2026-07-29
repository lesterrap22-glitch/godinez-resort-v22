import Reveal from '../components/Reveal.jsx';

// An isometric-style illustrated map, inspired by the angled "theme park
// map" look (e.g. campuestohanhighlandresort.com's Resort Map), but built
// from scratch as simple flat-color vector shapes in our own brand colors -
// not a traced copy of anyone else's artwork - and labeled with our own
// real villas, pools, resto, and activities.
//
// Everything below is computed with a small isometric-projection helper
// rather than hand-plotted polygon points, so the buildings/pools/roofs stay
// geometrically consistent no matter where they're placed on the map.

const ISO_R = { x: 0.87, y: 0.5 }; // "width" axis, going toward the right
const ISO_L = { x: -0.87, y: 0.5 }; // "depth" axis, going toward the left

function isoBox(x0, y0, w, d, h) {
  const p0 = { x: x0, y: y0 };
  const p1 = { x: x0 + w * ISO_R.x, y: y0 + w * ISO_R.y };
  const p2 = { x: p1.x + d * ISO_L.x, y: p1.y + d * ISO_L.y };
  const p3 = { x: x0 + d * ISO_L.x, y: y0 + d * ISO_L.y };
  const up = (pt) => ({ x: pt.x, y: pt.y - h });
  const [p0t, p1t, p2t, p3t] = [p0, p1, p2, p3].map(up);
  const poly = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return {
    top: poly([p0t, p1t, p2t, p3t]),
    left: poly([p0, p3, p3t, p0t]),
    right: poly([p0, p1, p1t, p0t]),
    corners: { p0, p1, p2, p3, p0t, p1t, p2t, p3t },
  };
}

function roofOf({ p0t, p1t, p2t, p3t }, rh) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - rh });
  const ridgeNear = mid(p0t, p1t);
  const ridgeFar = mid(p3t, p2t);
  const poly = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return {
    slopeLeft: poly([p0t, p3t, ridgeFar, ridgeNear]),
    slopeRight: poly([p1t, p2t, ridgeFar, ridgeNear]),
  };
}

// A little 3-face building block (walls + a pitched roof), reused for every
// villa and for G-Resto - only the size and color palette differ.
function Building({ x, y, w, d, h, roofHeight, walls, roof }) {
  const box = isoBox(x, y, w, d, h);
  const roofPolys = roofOf(box.corners, roofHeight);
  return (
    <g className="map-building-group">
      <polygon points={box.left} fill={walls.left} />
      <polygon points={box.right} fill={walls.right} />
      <polygon points={box.top} fill={walls.top} />
      <polygon points={roofPolys.slopeLeft} fill={roof.left} />
      <polygon points={roofPolys.slopeRight} fill={roof.right} />
    </g>
  );
}

const HUT_PALETTE = {
  walls: { top: '#fbf6e8', left: '#ece1c4', right: '#d9caa0' },
  roof: { left: '#2c5c40', right: '#163524' },
};
const RESTO_PALETTE = {
  walls: { top: '#f0c877', left: '#d9a441', right: '#b8842c' },
  roof: { left: '#2c5c40', right: '#163524' },
};
const PAVILION_PALETTE = {
  walls: { top: '#caa06b', left: '#a67c46', right: '#8a6435' },
  roof: { left: '#2c5c40', right: '#163524' },
};

function Pool({ x, y, w, d, small }) {
  const box = isoBox(x, y, w, d, 0);
  const innerBox = isoBox(x + w * 0.12, y + w * 0.06, w * 0.76, d * 0.76, 0);
  return (
    <g>
      <polygon points={box.top} className={`map-pool-shape${small ? ' map-pool-shape-small' : ''}`} />
      <polygon points={innerBox.top} className="map-pool-shimmer" />
    </g>
  );
}

function Tree({ x, y, scale = 1 }) {
  return (
    <g className="map-tree" transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="4" rx="9" ry="4" className="map-tree-shadow" />
      <rect x="-2.5" y="-6" width="5" height="10" className="map-tree-trunk" />
      <circle cx="0" cy="-14" r="13" className="map-tree-canopy" />
    </g>
  );
}

function Pin({ n, x, y, icon }) {
  return (
    <g className="map-pin">
      <circle cx={x} cy={y} r="15" className="map-pin-badge" />
      <text x={x} y={y + 5} textAnchor="middle" className="map-pin-number">{n}</text>
      {icon && <text x={x} y={y + 33} textAnchor="middle" className="map-pin-icon">{icon}</text>}
    </g>
  );
}

// Anchor points below are hand-placed on the isometric grid to echo the
// reference's diagonal layout (villas toward the near/left side, pools and
// G-Resto across the middle, activity grounds along the front), while
// naming the resort's own real spots (see server/data/content/*.json).
// Villas sit on a proper 2-column iso lattice (each step = one full ISO_R or
// ISO_L move of 90px) so neighboring huts never overlap - an earlier pass
// hand-placed these too close together and the roofs collided.
const VILLA_STEP = 90;
const villaAt = (col, row) => ({
  x: 300 + col * VILLA_STEP * ISO_R.x + row * VILLA_STEP * ISO_L.x,
  y: 190 + col * VILLA_STEP * ISO_R.y + row * VILLA_STEP * ISO_L.y,
});
const VILLAS = [
  { n: 1, name: 'Milagros Villa', ...villaAt(0, 0) },
  { n: 2, name: 'Zacarias Villa', ...villaAt(1, 0) },
  { n: 3, name: 'Bulalacao Villa', ...villaAt(0, 1) },
  { n: 4, name: 'Garzo Villa', ...villaAt(1, 1) },
  { n: 5, name: 'Pesquera Villa', ...villaAt(0, 2) },
  { n: 6, name: 'Mandin Villa', ...villaAt(1, 2) },
];

const TREES = [
  { x: 150, y: 150, scale: 1 },
  { x: 460, y: 140, scale: 0.85 },
  { x: 640, y: 165, scale: 0.9 },
  { x: 890, y: 240, scale: 1 },
  { x: 870, y: 460, scale: 0.9 },
  { x: 610, y: 500, scale: 1 },
  { x: 260, y: 510, scale: 0.9 },
  { x: 110, y: 420, scale: 0.85 },
];

const PINS = [
  ...VILLAS,
  { n: 7, name: 'Main Pool', x: 554, y: 300 },
  { n: 8, name: 'Kiddie Pool', x: 673, y: 288 },
  { n: 9, name: 'G-Resto', x: 797, y: 300, note: 'Negrense flavors, farm-to-table freshness' },
  {
    n: 10,
    name: 'Activity Grounds',
    x: 500,
    y: 430,
    note: 'Sugarcane Maze · Pick-and-Pay Garden · Kawa Baths · Carabao Cart · Native Games · Bonfire Nights · Inasal Masterclass · Farm-to-Table Class',
  },
  { n: 11, name: 'Events Pavilion', x: 700, y: 410, note: 'Weddings, reunions, and celebrations under a rustic, farm-style roof' },
];

export default function ResortMapSection() {
  return (
    <section id="map" className="section">
      <div className="container">
        <span className="eyebrow">Find your way</span>
        <h2>Resort Map</h2>
        <p className="section-intro">
          A quick look at how the villas, pools, G-Resto, the Events Pavilion, and the activity grounds all sit together on our property.
        </p>
        <Reveal as="div" className="resort-map-wrap">
          <div className="resort-map-card">
            <svg viewBox="0 0 1000 640" className="resort-map-svg" role="img" aria-label="Illustrated isometric map of Godinez Resort showing villas, pools, G-Resto, the Events Pavilion, and the activity grounds">
              <defs>
                <linearGradient id="mapGroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#eef3e0" />
                  <stop offset="100%" stopColor="#cfe0b0" />
                </linearGradient>
                <marker id="mapArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" className="map-arrowhead" />
                </marker>
              </defs>

              {/* Organic ground shape standing in for the resort grounds -
                  one continuous patch (like the reference map) rather than
                  separate colored zones, so buildings/pools read as sitting
                  on one property. */}
              <path
                d="M760,60 C900,85 985,215 955,315 C990,420 745,525 500,585 C295,565 35,480 60,300
                   C35,175 300,80 500,80 C605,58 700,50 760,60 Z"
                fill="url(#mapGroundGradient)"
                className="map-grounds"
              />

              {TREES.map((t, i) => <Tree key={i} x={t.x} y={t.y} scale={t.scale} />)}

              {/* Compass rose */}
              <g className="map-compass">
                <circle cx="900" cy="95" r="26" />
                <text x="900" y="76" textAnchor="middle" className="map-compass-label">N</text>
                <line x1="900" y1="84" x2="900" y2="108" markerEnd="url(#mapArrow)" />
              </g>

              {/* Entrance */}
              <g>
                <text x="740" y="110" textAnchor="middle" className="map-entrance-icon">🚩</text>
                <text x="740" y="130" textAnchor="middle" className="map-zone-label">Entrance</text>
              </g>

              {/* Walking trail linking the zones */}
              <path
                d="M740,140 C700,190 730,260 673,288 M600,296 C500,300 420,260 378,235 C350,215 325,200 300,190
                   M300,280 C270,300 245,315 222,325 M320,290 C370,340 440,390 500,430"
                className="map-trail"
                fill="none"
              />

              {/* Villas - small huts */}
              {VILLAS.map((v) => (
                <Building key={v.n} x={v.x} y={v.y} w={46} d={46} h={40} roofHeight={22} walls={HUT_PALETTE.walls} roof={HUT_PALETTE.roof} />
              ))}

              {/* Pools */}
              <Pool x={554} y={300} w={110} d={64} />
              <Pool x={673} y={288} w={62} d={40} small />

              {/* G-Resto */}
              <Building x={797} y={300} w={82} d={62} h={54} roofHeight={30} walls={RESTO_PALETTE.walls} roof={RESTO_PALETTE.roof} />

              {/* Events Pavilion */}
              <Building x={700} y={410} w={70} d={54} h={42} roofHeight={26} walls={PAVILION_PALETTE.walls} roof={PAVILION_PALETTE.roof} />

              {/* Activity Grounds - flat cluster of icons, no single
                  building since it's several open-air activities */}
              <g>
                <text x="280" y="510" textAnchor="middle" className="map-pin-icon">🌾</text>
                <text x="390" y="530" textAnchor="middle" className="map-pin-icon">🥬</text>
                <text x="500" y="540" textAnchor="middle" className="map-pin-icon">♨️</text>
                <text x="610" y="530" textAnchor="middle" className="map-pin-icon">🐃</text>
                <text x="710" y="505" textAnchor="middle" className="map-pin-icon">🎯</text>
                <text x="560" y="490" textAnchor="middle" className="map-pin-icon">🔥</text>
              </g>

              {PINS.map((p) => (
                <Pin key={p.n} n={p.n} x={p.x} y={p.y} />
              ))}
            </svg>
          </div>

          <ol className="map-legend">
            {PINS.map((p) => (
              <li key={p.n} className="map-legend-item">
                <span className="map-legend-badge">{p.n}</span>
                <span>
                  <span className="map-legend-name">{p.name}</span>
                  {p.note && <span className="map-legend-note"> — {p.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
