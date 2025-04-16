import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { Trophy, Users, TrendingUp, DollarSign } from 'lucide-react';
import Card from '../common/Card';
import PriceChart from './PriceChart';

const TeamInfo = ({ team }) => {
  if (!team) return null;

  const stats = [
    {
      name: 'Market Cap',
      value: `$${(team.marketCap / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      change: team.marketCapChange24h,
    },
    {
      name: 'Shareholders',
      value: team.shareholderCount.toLocaleString(),
      icon: Users,
      change: team.shareholderChange24h,
    },
    {
      name: 'Win Rate',
      value: `${(team.winRate * 100).toFixed(1)}%`,
      icon: Trophy,
      change: team.winRateChange,
    },
    {
      name: 'Performance',
      value: `${(team.performance * 100).toFixed(1)}%`,
      icon: TrendingUp,
      change: team.performanceChange,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <Image
              src={team.logoUrl}
              alt={team.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {team.name}
            </h1>
            <p className="mt-1 text-gray-500">{team.location}</p>
            <div className="mt-2 flex items-center">
              <span className="text-2xl font-bold text-gray-900">
                ${team.currentPrice.toFixed(2)}
              </span>
              <span className={`ml-2 flex items-center text-sm ${
                team.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {team.priceChange24h >= 0 ? '+' : ''}
                {team.priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="flex items-center p-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <Icon size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                {stat.change != null && (
                  <p className={`text-sm ${
                    stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Description */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
        <p className="text-gray-600">{team.description}</p>
      </Card>

      {/* Price Chart */}
      <PriceChart teamId={team.teamId} />
    </div>
  );
};

TeamInfo.propTypes = {
  team: PropTypes.shape({
    teamId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    logoUrl: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    currentPrice: PropTypes.number.isRequired,
    priceChange24h: PropTypes.number.isRequired,
    marketCap: PropTypes.number.isRequired,
    marketCapChange24h: PropTypes.number,
    shareholderCount: PropTypes.number.isRequired,
    shareholderChange24h: PropTypes.number,
    winRate: PropTypes.number.isRequired,
    winRateChange: PropTypes.number,
    performance: PropTypes.number.isRequired,
    performanceChange: PropTypes.number,
  }).isRequired,
};

export default TeamInfo;
