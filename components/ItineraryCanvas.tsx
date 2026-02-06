
import React from 'react';
import { CityNode, TransportEdge, TransportMode, HotelTier } from '../types';
import { ICONS } from '../constants';

interface ItineraryCanvasProps {
  nodes: CityNode[];
  edges: TransportEdge[];
  onUpdateNode: (id: string, updates: Partial<CityNode>) => void;
  onUpdateEdge: (id: string, updates: Partial<TransportEdge>) => void;
  onSelectNode: (nodeId: string) => void;
}

const ItineraryCanvas: React.FC<ItineraryCanvasProps> = ({ 
  nodes, 
  edges, 
  onUpdateNode, 
  onUpdateEdge,
  onSelectNode 
}) => {
  return (
    <div className="relative w-full overflow-x-auto py-20 px-12 min-h-[650px] flex items-center bg-[#F1F5F9] rounded-[40px] border border-slate-200/50 shadow-inner">
      <div className="flex items-center gap-16 min-w-max mx-auto">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            {/* City Node */}
            <div 
              onClick={() => onSelectNode(node.id)}
              className="group relative flex flex-col w-72 h-[420px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200/60 hover:border-blue-500 hover:shadow-blue-500/10 transition-all cursor-pointer transform hover:-translate-y-2 active:scale-95"
            >
              {/* Image Section */}
              <div className="h-40 w-full relative overflow-hidden">
                <img 
                  src={node.imageUrl || `https://source.unsplash.com/featured/?${node.name},travel`} 
                  alt={node.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 block">Stop {index + 1}</span>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">{node.name}</h3>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Duration</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateNode(node.id, { nights: Math.max(1, node.nights - 1) }) }}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
                      >-</button>
                      <span className="font-black text-slate-800 tabular-nums">{node.nights} <span className="text-[9px] font-bold text-slate-400">NTS</span></span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateNode(node.id, { nights: node.nights + 1 }) }}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm"
                      >+</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Lodging Level</span>
                    <select 
                      className="w-full text-xs font-bold p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 outline-none appearance-none cursor-pointer hover:bg-blue-100 transition-colors"
                      value={node.hotelTier}
                      onChange={(e) => { e.stopPropagation(); onUpdateNode(node.id, { hotelTier: e.target.value as HotelTier }) }}
                    >
                      <option value={HotelTier.BUDGET}>Budget Explorer</option>
                      <option value={HotelTier.STANDARD}>Standard Comfort</option>
                      <option value={HotelTier.LUXURY}>Luxury Indulgence</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-1.5 flex-wrap">
                  {node.experiences.slice(0, 3).map((exp, i) => (
                    <span key={i} className="text-[9px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold whitespace-nowrap">{exp}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Transport Edge */}
            {index < nodes.length - 1 && (
              <div className="relative flex flex-col items-center min-w-[140px]">
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200 absolute top-1/2 -translate-y-1/2 z-0 rounded-full opacity-50"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 text-blue-600 hover:scale-125 transition-all duration-300 cursor-pointer hover:shadow-blue-500/20 active:scale-90">
                    {edges[index]?.mode === TransportMode.FLIGHT && <ICONS.Plane />}
                    {edges[index]?.mode === TransportMode.TRAIN && <ICONS.Train />}
                    {edges[index]?.mode === TransportMode.CAB && <ICONS.Car />}
                    {edges[index]?.mode === TransportMode.BUS && <ICONS.Bus />}
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-full shadow-lg">
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{edges[index]?.duration}</span>
                  </div>
                  <div className="text-xs font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-lg shadow-sm">
                    ${edges[index]?.cost}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ItineraryCanvas;
