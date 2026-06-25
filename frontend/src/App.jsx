import React, { useEffect, useState, useRef } from 'react';
import { Network, Search, Link2, Activity, Play, ActivitySquare } from 'lucide-react';
import { fetchGraphData, runShortestPath, runDijkstraAll, runMst } from './api';
import GraphVisualizer from './components/GraphVisualizer';

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [activeTab, setActiveTab] = useState('path');
  
  // Selection state
  const [filter, setFilter] = useState('1'); // 1 = latency, 2 = cost
  const [srcNode, setSrcNode] = useState('');
  const [destNode, setDestNode] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Result state
  const [outputLog, setOutputLog] = useState('// Results will appear here...\n');
  const [routeLinks, setRouteLinks] = useState([]);
  const [mstLinks, setMstLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Layout state
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const graphContainerRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchGraphData();
      if (data && data.nodes) setGraphData(data);
    };
    loadData();

    const handleResize = () => {
      if (graphContainerRef.current) {
        setDimensions({
          w: graphContainerRef.current.clientWidth,
          h: graphContainerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearResults = () => {
    setRouteLinks([]);
    setMstLinks([]);
    setOutputLog('// Computing...\n');
  };

  const handleShortestPath = async () => {
    if (srcNode === '' || destNode === '') return;
    clearResults();
    setLoading(true);
    try {
      const res = await runShortestPath(srcNode, destNode, filter);
      setOutputLog(res.output || res.error || 'Server error');
      
      // Parse resulting path
      if (res.output && res.output.includes('Path:')) {
        const pathLine = res.output.split('\n').find(l => l.startsWith('Path:'));
        if (pathLine) {
          const pathStr = pathLine.replace('Path: ', '').trim();
          const nodes = pathStr.split(' -> ').map(n => {
            const match = n.match(/\[(\d+)\]/);
            return match ? parseInt(match[1]) : null;
          }).filter(n => n !== null);
          
          const links = [];
          for (let i = 0; i < nodes.length - 1; i++) {
            links.push({ source: nodes[i], target: nodes[i+1] });
          }
          setRouteLinks(links);
        }
      }
    } catch (e) {
      setOutputLog(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleDijkstraAll = async () => {
    if (srcNode === '') return;
    clearResults();
    setLoading(true);
    try {
      const res = await runDijkstraAll(srcNode, filter);
      setOutputLog(res.output || res.error || 'Server error');
    } catch (e) {
      setOutputLog(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleMst = async (algo) => {
    clearResults();
    setLoading(true);
    try {
      const res = await runMst(algo, filter);
      setOutputLog(res.output || res.error || 'Server error');
      
      // We can't perfectly reconstruct MST edges purely from the standard text output unless we parse it.
      // Let's highlight all nodes roughly or if the output provides edge pairs.
      // The C++ code outputs MST edges if choice=2, but backend hardcodes command.
      // Assuming we just want to show the text result for now, unless we write an edge parser.
    } catch (e) {
      setOutputLog(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const selectedNode = selectedNodeId !== null 
    ? graphData.nodes.find(n => n.id === selectedNodeId) 
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 glass-panel border-b-0 z-20 shadow-lg">
        <div className="text-2xl font-bold tracking-tight font-sans">
          Net<span className="text-accent">Route</span>
        </div>
        <div className="flex gap-4 text-xs text-muted items-center uppercase tracking-widest">
          <span className="flex items-center gap-2 text-accent3">
            <span className="w-2 h-2 rounded-full bg-accent3 animate-pulse shadow-[0_0_8px_#10b981]" />
            Server Online
          </span>
          <span>Nodes: {graphData.nodes.length}</span>
          <span>Edges: {graphData.links.length}</span>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-80 glass-panel flex flex-col z-10 border-r border-border">
          <div className="p-4 border-b border-border uppercase text-xs font-bold tracking-widest text-slate-400 font-sans">
            Algorithms Master
          </div>
          
          <div className="flex border-b border-border text-xs uppercase tracking-wider">
            {['path', 'dijkstra', 'mst'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 transition-colors ${activeTab === t ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            
            {/* Filter selection common to all */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500 tracking-widest">Optimization Metric</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-black/30 border border-border rounded p-2 text-sm text-slate-200 outline-none focus:border-accent"
              >
                <option value="1">Latency (Time)</option>
                <option value="2">Cost (USD)</option>
              </select>
            </div>

            {activeTab === 'path' && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 tracking-widest">Source Node</label>
                  <select value={srcNode} onChange={e => setSrcNode(e.target.value)} className="w-full bg-black/30 border border-border rounded p-2 text-sm text-slate-200 focus:border-accent">
                    <option value="">Select...</option>
                    {graphData.nodes.map(n => <option key={n.id} value={n.id}>[{n.id}] {n.location}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 tracking-widest">Destination Node</label>
                  <select value={destNode} onChange={e => setDestNode(e.target.value)} className="w-full bg-black/30 border border-border rounded p-2 text-sm text-slate-200 focus:border-accent">
                    <option value="">Select...</option>
                    {graphData.nodes.map(n => <option key={n.id} value={n.id}>[{n.id}] {n.location}</option>)}
                  </select>
                </div>
                <button onClick={handleShortestPath} disabled={loading} className="btn-primary flex justify-center items-center gap-2 mt-4">
                  <Play size={14} /> Calculate Route
                </button>
              </div>
            )}

            {activeTab === 'dijkstra' && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 tracking-widest">Source Node</label>
                  <select value={srcNode} onChange={e => setSrcNode(e.target.value)} className="w-full bg-black/30 border border-border rounded p-2 text-sm text-slate-200 focus:border-accent">
                    <option value="">Select...</option>
                    {graphData.nodes.map(n => <option key={n.id} value={n.id}>[{n.id}] {n.location}</option>)}
                  </select>
                </div>
                <button onClick={handleDijkstraAll} disabled={loading} className="btn-primary btn-green flex justify-center items-center gap-2 mt-4">
                  <Activity size={14} /> Compute All Distances
                </button>
              </div>
            )}

            {activeTab === 'mst' && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button onClick={() => handleMst('prim')} disabled={loading} className="btn-primary btn-purple">Prim's</button>
                  <button onClick={() => handleMst('kruskal')} disabled={loading} className="btn-primary">Kruskal's</button>
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* Center Canvas */}
        <section className="flex-1 relative bg-black/20" ref={graphContainerRef}>
          <div className="absolute inset-0 z-0">
            {dimensions.w > 0 && graphData.nodes.length > 0 && (
              <GraphVisualizer 
                data={graphData} 
                w={dimensions.w} 
                h={dimensions.h} 
                onNodeClick={(node) => setSelectedNodeId(node ? node.id : null)}
                selectedNodeId={selectedNodeId}
                routeLinks={routeLinks}
                mstLinks={mstLinks}
                filter={filter}
              />
            )}
          </div>
          
          {/* Legend */}
          <div className="absolute top-4 left-4 glass-panel p-3 rounded-lg text-xs space-y-2 z-10 opacity-80 pointer-events-none">
            <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-[#1e3a5f]" /> Physical Cable</div>
            <div className="flex items-center gap-2"><div className="w-5 h-0.5 bg-accent" /> Active Route</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent/20 border border-accent" /> Selected Node</div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-80 glass-panel flex flex-col z-10 border-l border-border">
          <div className="p-4 border-b border-border uppercase text-xs font-bold tracking-widest text-slate-400 font-sans">
            Inspector
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
            {/* Inspector Details */}
            <div className="bg-black/40 border border-border p-4 rounded-lg">
              <div className="text-[10px] uppercase text-slate-500 tracking-widest mb-1">Selected Location</div>
              {selectedNode ? (
                <div>
                  <div className="text-lg font-bold text-accent">[{selectedNode.id}] {selectedNode.location}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    Connections: {graphData.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id || l.source?.id === selectedNode.id || l.target?.id === selectedNode.id).length}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">Click a node on the graph to inspect</div>
              )}
            </div>

            {/* Output Console */}
            <div className="flex-1 flex flex-col">
              <div className="text-[10px] uppercase text-slate-500 tracking-widest mb-2 flex items-center justify-between">
                Terminal Output
                {loading && <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
              </div>
              <div className="flex-1 bg-black/60 border border-border p-3 rounded-lg overflow-y-auto text-xs font-mono whitespace-pre-wrap text-slate-300 leading-relaxed shadow-inner font-light">
                {outputLog}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
