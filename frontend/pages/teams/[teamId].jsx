// pages/teams/[teamId].jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PriceChart from '../../components/teams/PriceChart';
import TradePanel from '../../components/teams/TradePanel';
import TeamInfo from '../../components/teams/TeamInfo';
import NewsFeed from '../../components/teams/NewsFeed';
import TeamDiscussion from '../../components/teams/TeamDiscussion';
import TeamRewards from '../../components/teams/TeamRewards';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function TeamDetailPage() {
  const router = useRouter();
  const { teamId } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [teamData, setTeamData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading]);
  
  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);
  
  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch team details
      const teamResponse = await api.get(`/teams/${teamId}`);
      setTeamData(teamResponse.data);
      
      // Fetch price history
      const priceResponse = await api.get(`/teams/${teamId}/price-history`, {
        params: { period: '1m', interval: '1d' }
      });
      setPriceHistory(priceResponse.data.data);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data');
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (!teamData) {
    return <div>Team not found</div>;
  }
  
  return (
    <DashboardLayout>
      {/* Team Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
              {teamData.logoUrl ? (
                <img src={teamData.logoUrl} alt={teamData.name} className="h-12 w-12" />
              ) : (
                '🏈'
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{teamData.name}</h1>
              <p className="text-gray-500">{teamData.league.name}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="text-right mr-8">
              <p className="text-3xl font-bold text-gray-900">
                ${teamData.financials.currentSharePrice.toFixed(2)}
              </p>
              <p className={`text-sm flex items-center justify-end ${
                teamData.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {/* Price change indicator here */}
                {teamData.priceChange >= 0 ? '+' : ''}{teamData.priceChange || '0.00'}% Today
              </p>
            </div>
            
            <div>
              <button 
                onClick={() => router.push(`/trade/${teamId}?action=buy`)}
                className="bg-green-600 text-white rounded-md px-6 py-2 font-medium hover:bg-green-700 mr-2"
              >
                Buy
              </button>
              <button 
                onClick={() => router.push(`/trade/${teamId}?action=sell`)}
                className="border border-green-600 text-green-600 rounded-md px-6 py-2 font-medium hover:bg-green-50"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('performance')}
            className={`${
              activeTab === 'performance'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Performance
          </button>
          <button
            onClick={() => handleTabChange('news')}
            className={`${
              activeTab === 'news'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            News
          </button>
          <button
            onClick={() => handleTabChange('discussion')}
            className={`${
              activeTab === 'discussion'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Discussion
          </button>
          <button
            onClick={() => handleTabChange('rewards')}
            className={`${
              activeTab === 'rewards'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Fan Rewards
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Price Chart */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Price History</h2>
              <div className="flex space-x-2">
                <button className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">1D</button>
                <button className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">1W</button>
                <button className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">1M</button>
                <button className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">3M</button>
                <button className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">1Y</button>
                <button className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">All</button>
              </div>
            </div>
            
            <PriceChart data={priceHistory} />
          </div>
          
          {/* Team Info */}
          {activeTab === 'overview' && (
            <TeamInfo team={teamData} />
          )}
          
          {/* Performance Stats */}
          {activeTab === 'performance' && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Season Performance</h2>
              {teamData.performance ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Season</p>
                    <p className="text-gray-900">{teamData.performance.currentSeason}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Record</p>
                    <p className="text-gray-900">
                      {teamData.performance.wins}-{teamData.performance.losses}
                      {teamData.performance.ties > 0 ? `-${teamData.performance.ties}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Points For</p>
                    <p className="text-gray-900">{teamData.performance.pointsFor}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Points Against</p>
                    <p className="text-gray-900">{teamData.performance.pointsAgainst}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Playoff Appearance</p>
                    <p className="text-gray-900">{teamData.performance.playoffAppearance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Championship</p>
                    <p className="text-gray-900">{teamData.performance.championshipWin ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No performance data available</p>
              )}
            </div>
          )}
          
          {/* News Feed */}
          {activeTab === 'news' && (
            <NewsFeed teamId={teamId} />
          )}
          
          {/* Discussion */}
          {activeTab === 'discussion' && (
            <TeamDiscussion teamId={teamId} />
          )}
          
          {/* Rewards */}
          {activeTab === 'rewards' && (
            <TeamRewards teamId={teamId} />
          )}
        </div>
        
        {/* Right Column (Trade Panel) */}
        <div>
          <TradePanel team={teamData} />
        </div>
      </div>
    </DashboardLayout>
  );
}