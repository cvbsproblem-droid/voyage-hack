
import React, { useState, useEffect, useCallback } from 'react';
import { Trip, CityNode, TransportEdge, HotelTier, TransportMode, GroundingSource, HotelOffer } from './types';
import { ICONS, COLORS } from './constants';
import { generateItinerary, getPlaceRecommendations, getDeepThinkingOptimization } from './services/geminiService';
import { fetchTboHotelOffers } from './services/tboService';
import ItineraryCanvas from './components/ItineraryCanvas';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'builder' | 'review'>('landing');
  const [searchParams, setSearchParams] = useState({ destination: '', startDate: '', endDate: '', travelers: 2 });
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarData, setSidebarData] = useState<{text: string, sources: GroundingSource[]} | null>(null);
  const [hotelOffers, setHotelOffers] = useState<HotelOffer[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [optimizationText, setOptimizationText] = useState("");

  const handleStartPlanning = async (autoPlan: boolean) => {
    setIsLoading(true);
    try {
      const result = await generateItinerary({
        ...searchParams,
        intent: autoPlan ? "Create an optimized, balanced route with top attractions." : "Just suggest the main cities, I will choose details."
      });
      
      const newTrip: Trip = {
        id: Math.random().toString(36).substr(2, 9),
        ...searchParams,
        nodes: result.nodes.map((n: any) => ({ ...n, hotelTier: HotelTier.STANDARD })),
        edges: result.edges,
        totalCost: 0 
      };
      
      recalculateCost(newTrip);
      setTrip(newTrip);
      setView('builder');
    } catch (err) {
      console.error(err);
      alert("Failed to generate itinerary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateNode = (id: string, updates: Partial<CityNode>) => {
    if (!trip) return;
    const newNodes = trip.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    const updatedTrip = { ...trip, nodes: newNodes };
    setTrip(updatedTrip);
    recalculateCost(updatedTrip);
  };

  const updateEdge = (id: string, updates: Partial<TransportEdge>) => {
    if (!trip) return;
    const newEdges = trip.edges.map(e => e.id === id ? { ...e, ...updates } : e);
    const updatedTrip = { ...trip, edges: newEdges };
    setTrip(updatedTrip);
    recalculateCost(updatedTrip);
  };

  const recalculateCost = (currentTrip: Trip) => {
    const transportCost = currentTrip.edges.reduce((acc, e) => acc + e.cost, 0);
    const accommodationCost = currentTrip.nodes.reduce((acc, n) => {
      const rate = n.selectedHotel ? n.selectedHotel.pricePerNight : 
                   (n.hotelTier === HotelTier.LUXURY ? 500 : n.hotelTier === HotelTier.STANDARD ? 200 : 100);
      return acc + (n.nights * rate * currentTrip.travelers);
    }, 0);
    setTrip({ ...currentTrip, totalCost: Math.round(transportCost + accommodationCost) });
  };

  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const node = trip?.nodes.find(n => n.id === nodeId);
    if (node) {
      setIsLoading(true);
      try {
        const [details, offers] = await Promise.all([
          getPlaceRecommendations(node.name),
          fetchTboHotelOffers(node.name, node.hotelTier)
        ]);
        setSidebarData(details);
        setHotelOffers(offers);
      } catch (err) {
        console.error("Error fetching node data", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectHotel = (hotel: HotelOffer) => {
    if (selectedNodeId) {
      updateNode(selectedNodeId, { selectedHotel: hotel });
    }
  };

  const runOptimizer = async () => {
    if (!trip) return;
    setIsThinking(true);
    try {
      const result = await getDeepThinkingOptimization(trip);
      
      // Automatic state update based on AI reasoning
      const updatedNodes = trip.nodes.map(n => {
        const optNode = result.nodes.find((on: any) => on.id === n.id);
        return optNode ? { ...n, nights: optNode.nights } : n;
      });

      const updatedEdges = trip.edges.map(e => {
        const optEdge = result.edges.find((oe: any) => oe.id === e.id);
        return optEdge ? { ...e, mode: optEdge.mode as TransportMode, cost: optEdge.cost, duration: optEdge.duration } : e;
      });

      const updatedTrip = { ...trip, nodes: updatedNodes, edges: updatedEdges };
      setTrip(updatedTrip);
      recalculateCost(updatedTrip);
      setOptimizationText(result.reasoning);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setIsThinking(false);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white relative flex items-center justify-center p-6 overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            alt="Travel Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950"></div>
        </div>

        <div className="max-w-4xl w-full relative z-10 text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-tight italic drop-shadow-2xl">
              VOYAGE<span className="text-blue-500">AI</span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-200 font-light max-w-3xl mx-auto tracking-wide leading-relaxed">
              Where luxury meets logic. Plan your ultimate escape with <span className="text-blue-400 font-bold">real-time TBO pricing</span> and Gemini deep-thinking.
            </p>
          </div>

          <div className="glass-morphism rounded-[48px] p-10 md:p-16 shadow-3xl text-slate-900 max-w-3xl mx-auto space-y-10 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-left group">
                <label className="text-[10px] font-black uppercase text-blue-500 mb-2 block tracking-widest group-focus-within:text-blue-600">Dream Destination</label>
                <input 
                  type="text" 
                  placeholder="Where to, explorer?" 
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 bg-white/80 focus:bg-white outline-none transition-all text-lg font-bold"
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                />
              </div>
              <div className="text-left group">
                <label className="text-[10px] font-black uppercase text-blue-500 mb-2 block tracking-widest">Party Size</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 bg-white/80 outline-none transition-all text-lg font-bold"
                  value={searchParams.travelers}
                  onChange={(e) => setSearchParams({...searchParams, travelers: parseInt(e.target.value)})}
                />
              </div>
              <div className="text-left group">
                <label className="text-[10px] font-black uppercase text-blue-500 mb-2 block tracking-widest">Arrival</label>
                <input type="date" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 bg-white/80 outline-none transition-all font-bold" value={searchParams.startDate} onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})}/>
              </div>
              <div className="text-left group">
                <label className="text-[10px] font-black uppercase text-blue-500 mb-2 block tracking-widest">Departure</label>
                <input type="date" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 bg-white/80 outline-none transition-all font-bold" value={searchParams.endDate} onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})}/>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => handleStartPlanning(true)}
                disabled={!searchParams.destination || isLoading}
                className="w-full bg-blue-600 text-white font-black py-6 px-12 rounded-[28px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-500/40 disabled:opacity-50 text-xl tracking-tighter uppercase italic"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-4">
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Crafting Magic...
                  </span>
                ) : "Launch Auto-Planner"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Inter']">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-10 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-10">
          <h2 onClick={() => setView('landing')} className="text-3xl font-black text-slate-900 cursor-pointer italic tracking-tighter hover:text-blue-600 transition-colors">VOYAGE<span className="text-blue-500">AI</span></h2>
          <div className="hidden lg:flex items-center gap-4 py-2 px-6 bg-slate-100 rounded-2xl border border-slate-200">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Current Expedition</span>
              <span className="text-sm font-bold text-slate-800">{searchParams.destination} • {searchParams.travelers} Guests</span>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Duration</span>
              <span className="text-sm font-bold text-slate-800">{trip?.nodes.reduce((a, b) => a + b.nights, 0)} Nights</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Estimated Total</span>
            <span className="text-3xl font-black text-slate-900 tabular-nums">
              ${trip?.totalCost?.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={() => setView('review')} 
            className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/20 transition-all uppercase tracking-tighter text-sm italic"
          >
            Review Itinerary
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[340px] border-r border-slate-200 bg-white overflow-y-auto p-8 flex flex-col gap-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <ICONS.Star /> Gemini Optimizer
              </h3>
              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">PRO 3.0</span>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-200 space-y-6 shadow-sm">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Our AI uses deep reasoning to refine your stops for better logistical flow and maximum bucket-list potential.
              </p>
              <button 
                onClick={runOptimizer} 
                disabled={isThinking} 
                className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
              >
                {isThinking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    Thinking...
                  </>
                ) : "Refine My Journey"}
              </button>
              {optimizationText && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">AI Analysis</span>
                  <div className="text-[11px] text-slate-600 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 max-h-52 overflow-y-auto leading-relaxed">
                    {optimizationText}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="flex-1 space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Global Styles</h3>
            <div className="grid grid-cols-1 gap-4">
              {[HotelTier.BUDGET, HotelTier.STANDARD, HotelTier.LUXURY].map(t => (
                <button 
                  key={t}
                  onClick={() => trip?.nodes.forEach(n => updateNode(n.id, { hotelTier: t }))}
                  className="group relative w-full overflow-hidden p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${t === HotelTier.LUXURY ? 'bg-amber-400' : t === HotelTier.STANDARD ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">{t} Vibes</span>
                  <span className="text-[10px] text-slate-400">Set all stops to {t.toLowerCase()} lodging</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="flex-1 relative overflow-hidden bg-[#F1F5F9] p-12 overflow-y-auto flex flex-col">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">YOUR JOURNEY</h1>
              <p className="text-slate-500 font-medium mt-1">Sourced from <span className="text-blue-600 font-black uppercase text-[10px]">TBO Holidays</span> & Google Maps</p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all">
                <ICONS.Map /> Show Map View
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {trip && (
              <ItineraryCanvas 
                nodes={trip.nodes}
                edges={trip.edges}
                onUpdateNode={updateNode}
                onUpdateEdge={updateEdge}
                onSelectNode={handleSelectNode}
              />
            )}
          </div>
        </div>

        <aside className="w-[420px] border-l border-slate-200 bg-white overflow-y-auto">
          {selectedNodeId ? (
            <div className="p-10 space-y-10 animate-in slide-in-from-right duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                    {trip?.nodes.find(n => n.id === selectedNodeId)?.name}
                  </h2>
                  <button onClick={() => setSelectedNodeId(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-all text-2xl font-light">&times;</button>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  {trip?.nodes.find(n => n.id === selectedNodeId)?.description}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Live TBO Offers</h3>
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] font-black text-slate-900 uppercase">Live Staging</span>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-50 animate-pulse rounded-[28px]"></div>)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hotelOffers.map((offer) => {
                      const isSelected = trip?.nodes.find(n => n.id === selectedNodeId)?.selectedHotel?.hotelCode === offer.hotelCode;
                      return (
                        <div 
                          key={offer.hotelCode}
                          onClick={() => handleSelectHotel(offer)}
                          className={`group relative flex gap-5 p-5 rounded-[28px] border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-600 bg-blue-50/40 shadow-xl shadow-blue-500/5' : 'border-slate-50 bg-white hover:border-blue-200 hover:shadow-lg'}`}
                        >
                          <img src={offer.thumbnail} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={offer.name} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-black text-slate-900 leading-tight pr-4">{offer.name}</h4>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-black text-amber-500">{offer.rating}</span>
                                <ICONS.Star />
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">{offer.description}</p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-sm font-black text-blue-600">${offer.pricePerNight} <span className="text-[9px] font-bold text-slate-300 uppercase">/ Night</span></span>
                              {isSelected ? (
                                <span className="text-[9px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Locked</span>
                              ) : (
                                <span className="text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Select Offer</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-slate-100">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Local Insider</h3>
                 <div className="text-xs text-slate-600 bg-slate-50 p-6 rounded-[32px] italic leading-relaxed border border-slate-100 font-medium">
                   {sidebarData?.text}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-16 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-6">
                 <ICONS.Map />
              </div>
              <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-2">Select a Stop</h3>
              <p className="text-sm text-slate-400 font-medium max-w-[240px]">Dive into local recommendations and live TBO accommodation offers.</p>
            </div>
          )}
        </aside>
      </main>

      {view === 'review' && trip && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-white rounded-[64px] w-full max-w-6xl p-16 relative shadow-4xl border border-white/20 my-auto">
            <button onClick={() => setView('builder')} className="absolute top-12 right-12 w-16 h-16 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-all text-4xl font-light shadow-sm">&times;</button>
            
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">VOYAGE SUMMARY</h2>
                <div className="flex gap-6 mt-6 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Reference: {trip.id}</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Sourced: TBO Holidays</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Guaranteed Total</span>
                <span className="text-6xl font-black text-slate-900 tabular-nums">${trip.totalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase mb-8 tracking-[0.2em] flex items-center gap-4">
                    Lodging Blueprint <div className="h-px flex-1 bg-slate-100"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trip.nodes.map((node, i) => (
                      <div key={node.id} className="flex flex-col gap-6 p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:border-blue-200 transition-colors group">
                        <div className="flex justify-between items-start">
                           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center font-black text-lg text-blue-600 shadow-sm border border-slate-100">{i+1}</div>
                           <span className="text-xs font-black text-slate-400 uppercase">{node.nights} NTS</span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{node.name}</h4>
                          <div className="mt-4 p-4 bg-white rounded-3xl border border-slate-200 flex items-center gap-4 shadow-sm group-hover:shadow-md transition-shadow">
                            <img src={node.selectedHotel?.thumbnail || node.imageUrl} className="w-14 h-14 rounded-2xl object-cover" />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-black text-slate-800 truncate">{node.selectedHotel?.name || `Default ${node.hotelTier} Stay`}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Status: Ready to Book</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-blue-600">${node.selectedHotel?.pricePerNight || 200}</p>
                              <p className="text-[8px] text-slate-400 font-black uppercase">/ Night</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-10">
                 <div className="p-10 bg-slate-950 rounded-[56px] text-white space-y-10 sticky top-12 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em] mb-4">Pricing Breakdown</h3>
                      <div className="space-y-4">
                         <div className="flex justify-between text-sm font-bold">
                            <span className="opacity-50 tracking-tight italic">Global Transport</span>
                            <span className="tabular-nums">${trip.edges.reduce((a,b) => a+b.cost, 0).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm font-bold">
                            <span className="opacity-50 tracking-tight italic">Stays & Resorts</span>
                            <span className="tabular-nums">${(trip.totalCost - trip.edges.reduce((a,b) => a+b.cost, 0)).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-sm font-bold">
                            <span className="opacity-50 tracking-tight italic">Guest Count</span>
                            <span className="tabular-nums">x{trip.travelers}</span>
                         </div>
                      </div>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10">
                      <button 
                        onClick={() => alert(`Confirmed for ${trip.travelers} guests via TBO. Agency Code: TBO-MOCK-992`)}
                        className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm uppercase tracking-[0.2em] italic hover:bg-blue-500 hover:scale-[1.03] transition-all shadow-2xl shadow-blue-500/30 active:scale-95"
                      >
                        Secure Reservation
                      </button>
                      <p className="text-[9px] text-center opacity-30 uppercase font-black tracking-widest mt-6">Instant confirmation via TBO Staging Network</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
