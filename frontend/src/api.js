export const API_URL = 'http://localhost:5002';

export const fetchGraphData = async () => {
  // Use the local file as per the existing app logic (often served by express)
  // or via an endpoint if you create one. Since backend.js serves static in __dirname,
  // fetching '/Data.json' from it might work, or we can fetch directly relative if we are in dev.
  // Wait, backend.js runs on 5002 and serves __dirname.
  try {
    const res = await fetch(`${API_URL}/Data.json`);
    if (!res.ok) throw new Error('Failed to fetch data');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error loading graph data:", error);
    return { nodes: [], links: [] };
  }
};

export const runShortestPath = async (from, to, filter) => {
  const res = await fetch(`${API_URL}/shortest-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, filter })
  });
  return res.json();
};

export const runDijkstraAll = async (src, filter) => {
  const res = await fetch(`${API_URL}/dijkstra-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src, filter })
  });
  return res.json();
};

export const runMst = async (algorithm, filter) => {
  const endpoint = algorithm === 'prim' ? '/mst/prim' : '/mst/kruskal';
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter })
  });
  return res.json();
};

export const saveData = async (data) => {
  const res = await fetch(`${API_URL}/save-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};
