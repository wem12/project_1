// pages/rewards/index.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { 
  Award, 
  Ticket, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  Filter, 
  Search,
  Gift,
  Clipboard,
  AlertCircle
} from 'lucide-react';

export default function RewardsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('available');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [statistics, setStatistics] = useState({
    totalValue: 0,
    availableCount: 0,
    redeemedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, activeTab, selectedTeam]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch teams for filtering
      if (teams.length === 0) {
        const teamsResponse = await api.get('/teams', {
          params: { limit: 100 }
        });
        setTeams([
          { id: 'all', name: 'All Teams' },
          ...teamsResponse.data.teams.map(team => ({
            id: team.teamId,
            name: team.name
          }))
        ]);
      }
      
      // Fetch rewards based on active tab
      if (activeTab === 'available' || activeTab === 'upcoming') {
        const status = activeTab === 'available' ? 'active' : 'upcoming';
        const rewardsResponse = await api.get('/rewards', {
          params: {
            status,
            teamId: selectedTeam !== 'all' ? selectedTeam : undefined,
            limit: 50
          }
        });
        
        setRewards(rewardsResponse.data.rewards);
        
        // Calculate statistics
        const totalValue = rewardsResponse.data.rewards.reduce(
          (sum, reward) => sum + reward.valueAmount, 0
        );
        
        setStatistics(prevStats => ({
          ...prevStats,
          totalValue,
          availableCount: rewardsResponse.data.rewards.length
        }));
      } else if (activeTab === 'redeemed') {
        const redeemedResponse = await api.get('/rewards/redeemed', {
          params: { limit: 50 }
        });
        
        setRedeemedRewards(redeemedResponse.data.redeemedRewards);
        
        setStatistics(prevStats => ({
          ...prevStats,
          redeemedCount: redeemedResponse.data.redeemedRewards.length
        }));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
      setError('Failed to load rewards data');
      setIsLoading(false);
    }
  };
  
  const handleRedeemReward = async (rewardId) => {
    try {
      setIsLoading(true);
      
      const response = await api.post(`/rewards/${rewardId}/redeem`);
      
      // Show success notification
      alert(`Successfully redeemed reward! Your code is: ${response.data.redemptionCode}`);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert(error.response?.data?.message || 'Failed to redeem reward');
      setIsLoading(false);
    }
  };
  
  // Filter rewards by search query
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reward.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Function to render the appropriate icon based on type
  const renderIcon = (rewardType) => {
    switch(rewardType) {
      case 'ticket':
        return <Ticket size={24} className="text-blue-500" />;
      case 'merchandise':
        return <ShoppingBag size={24} className="text-green-500" />;
      case 'experience':
        return <Calendar size={24} className="text-purple-500" />;
      case 'dividend':
        return <DollarSign size={24} className="text-yellow-500" />;
      case 'concession':
        return <Gift size={24} className="text-red-500" />;
      default:
        return <Award size={24} className="text-blue-500" />;
    }
  };
  
  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fan Rewards</h1>
        <p className="text-gray-500">Exclusive benefits for team shareholders</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`${
              activeTab === 'available'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Award size={16} className="inline mr-1" />
            Available Rewards
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`${
              activeTab === 'upcoming'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Calendar size={16} className="inline mr-1" />
            Upcoming Rewards
          </button>
          <button
            onClick={() => setActiveTab('redeemed')}
            className={`${
              activeTab === 'redeemed'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <Clipboard size={16} className="inline mr-1" />
            Redeemed Rewards
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            {activeTab === 'available' && (
              <>
                <Award size={20} className="mr-2 text-green-500" />
                Available Rewards
              </>
            )}
            {activeTab === 'upcoming' && (
              <>
                <Calendar size={20} className="mr-2 text-blue-500" />
                Upcoming Rewards
              </>
            )}
            {activeTab === 'redeemed' && (
              <>
                <Clipboard size={20} className="mr-2 text-purple-500" />
                Redeemed Rewards
              </>
            )}
          </h2>
          
          {(activeTab === 'available' || activeTab === 'upcoming') && (
            <div className="flex space-x-2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search rewards"
                />
              </div>
              <div className="relative">
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {(activeTab === 'available' || activeTab === 'upcoming') && (
          <>
            {/* Stats section */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Reward Value</p>
                    <p className="text-xl font-bold text-gray-900">${statistics.totalValue.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <Award size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Rewards</p>
                    <p className="text-xl font-bold text-gray-900">{statistics.availableCount}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                    <ShoppingBag size={24} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Redeemed This Season</p>
                    <p className="text-xl font-bold text-gray-900">{statistics.redeemedCount}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rewards cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <div key={reward.rewardId} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {renderIcon(reward.rewardType)}
                      </div>
                      <span className="font-medium text-gray-900">{reward.team.name}</span>
                    </div>
                    <span className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                      {reward.rewardType.charAt(0).toUpperCase() + reward.rewardType.slice(1)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">{reward.name}</h3>
                    <p className="text-gray-700 text-sm mb-3">{reward.description}</p>
                    
                    <div className="mb-3">
                      <p className="text-gray-500 text-xs mb-1">Requirements:</p>
                      <p className="text-gray-700 text-sm">
                        {reward.requiredShares > 0 && `Hold at least ${reward.requiredShares} shares`}
                        {reward.requiredShares > 0 && reward.requiredHoldDays > 0 && ' for '}
                        {reward.requiredHoldDays > 0 && `${reward.requiredHoldDays}+ days`}
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-500 text-xs mb-1">
                        {activeTab === 'available' ? 'Valid Until:' : 'Available On:'}
                      </p>
                      <p className="text-gray-700 text-sm">
                        {activeTab === 'available' 
                          ? new Date(reward.endDate).toLocaleDateString() 
                          : new Date(reward.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-500 text-xs mb-1">Estimated Value:</p>
                      <p className="font-medium text-gray-900">${reward.valueAmount.toFixed(2)}</p>
                    </div>
                    
                    <button 
                      className={`w-full py-2 px-4 rounded-md font-medium ${
                        activeTab === 'available' && reward.isEligible
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={activeTab !== 'available' || !reward.isEligible || reward.alreadyRedeemed}
                      onClick={() => handleRedeemReward(reward.rewardId)}
                    >
                      {activeTab === 'available' 
                        ? (reward.alreadyRedeemed 
                            ? 'Already Redeemed' 
                            : (reward.isEligible ? 'Redeem Reward' : 'Not Eligible')) 
                        : 'Coming Soon'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredRewards.length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <AlertCircle size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No rewards found</h3>
                  <p className="text-gray-500">
                    {activeTab === 'available' 
                      ? 'There are no available rewards matching your filter criteria.'
                      : 'There are no upcoming rewards for this team yet.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'redeemed' && (
          <>
            {redeemedRewards.length > 0 ? (
              <div className="space-y-4">
                {redeemedRewards.map((reward) => (
                  <div key={reward.userRewardId} className="bg-white shadow rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                          {renderIcon(reward.reward.rewardType)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{reward.reward.name}</h3>
                          <p className="text-gray-500 text-sm">{reward.reward.team.teamName}</p>
                          <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                            <span>Redeemed: {new Date(reward.redeemedAt).toLocaleDateString()}</span>
                            <span>Expires: {new Date(reward.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`${
                          reward.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        } rounded-md px-3 py-1 text-xs font-medium inline-block mb-2`}>
                          {reward.status === 'expired' ? 'Expired' : 'Redeemed'}
                        </div>
                        <div className="border border-dashed border-gray-300 rounded-md p-2 bg-gray-50">
                          <p className="text-xs text-gray-500 mb-1">Redemption Code</p>
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-gray-900">{reward.redemptionCode}</code>
                            <button 
                              className="text-green-600 hover:text-green-700"
                              onClick={() => navigator.clipboard.writeText(reward.redemptionCode)}
                            >
                              <Clipboard size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <Clipboard size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No redeemed rewards</h3>
                  <p className="text-gray-500">You haven't redeemed any rewards yet.</p>
                  <button 
                    onClick={() => setActiveTab('available')}
                    className="mt-4 bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-700"
                  >
                    Browse Available Rewards
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}