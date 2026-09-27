import React, { useState } from 'react';
import { ScanRecord } from '../types';
import { FLEET_CATALOG } from '../data/fleetCatalog';
import {
  Search,
  ArrowUpRight,
  Shield,
  Gauge,
  Fuel,
  MapPin,
} from 'lucide-react';

interface FleetMarketplaceProps {
  onSelectScan: (scan: ScanRecord) => void;
  onRunCompare: (pickupScan: ScanRecord, returnScan: ScanRecord) => void;
  onStartNewScan: () => void;
}

export const FleetMarketplace: React.FC<FleetMarketplaceProps> = ({
  onSelectScan,
  onRunCompare,
  onStartNewScan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'EV / Tech', 'Sedan', 'SUV', 'Sports', 'Truck'];

  const filteredAssets = FLEET_CATALOG.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.specs?.category === selectedCategory;
    const matchesQuery =
      item.vehicleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vinOrPlate.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Fleet Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Cryptographic ground truth records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunCompare(FLEET_CATALOG[1], FLEET_CATALOG[0])}
            className="px-3 py-1.5 rounded text-xs font-mono text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
          >
            Compare T0/T1
          </button>
          <button
            onClick={onStartNewScan}
            className="px-3.5 py-1.5 rounded text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            + New Scan
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Flat Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded transition-colors font-mono ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Minimal Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search VIN or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-850 rounded text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
          />
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.map((vehicle) => {
          const specs = vehicle.specs;
          const hasDamage = vehicle.damages.length > 0;

          return (
            <div
              key={vehicle.id}
              onClick={() => onSelectScan(vehicle)}
              className="bg-neutral-950 border border-neutral-900 hover:border-neutral-700 transition-colors cursor-pointer flex flex-col justify-between"
            >
              {/* Image Frame */}
              <div className="relative aspect-[16/10] bg-neutral-900 border-b border-neutral-900">
                <img
                  src={vehicle.frames[0]?.dataUrl}
                  alt={vehicle.vehicleLabel}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-black text-neutral-300 border border-neutral-800">
                    {vehicle.type === 'pickup' ? 'T0 Pickup' : 'T1 Return'}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-black border border-neutral-800">
                    {vehicle.verification.overallTrustScore}% Trust
                  </span>
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {vehicle.vehicleLabel}
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                      {vehicle.vinOrPlate}
                    </p>
                  </div>
                  {specs?.rentalDailyRate && (
                    <span className="text-xs font-mono text-neutral-300">
                      ${specs.rentalDailyRate}/d
                    </span>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
                  <span>{specs?.odometerMiles.toLocaleString() || '14,200'} mi</span>
                  <span className="truncate">{specs?.fuelOrBattery || 'Electric'}</span>
                  <span className="truncate">{specs?.locationCity.split(',')[0]}</span>
                  <span className={hasDamage ? 'text-neutral-300' : 'text-neutral-500'}>
                    {hasDamage ? `${vehicle.damages.length} damage` : 'Clean'}
                  </span>
                </div>

                {/* SHA-256 Digest Preview */}
                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[10px] font-mono text-neutral-600">
                  <span className="truncate">{vehicle.sha256Hash.slice(0, 18)}...</span>
                  <span className="text-neutral-400 flex items-center gap-0.5">
                    Inspect <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
