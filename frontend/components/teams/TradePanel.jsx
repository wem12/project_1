// components/teams/TradePanel.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function TradePanel({ team }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [tradeType, setTradeType] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSharesChange = (e) => {
    const value = e.target.value;
    if (!value || /^\d*\.?\d*$/.test(value)) {
      setShares(value);
    }
  };
  
  const handleLimitPriceChange = (e) => {
    const value = e.target.value;
    if (!value || /^\d*\.?\d*$/.test(value)) {
      setLimitPrice(value);
    }
  };
  
  // components/teams/TradePanel.jsx (continued)

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!shares || parseFloat(shares) <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }
    
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setError('Please enter a valid limit price');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const orderData = {
        teamId: team.teamId,
        orderType,
        action: tradeType,
        shares: parseFloat(shares),
        price: orderType === 'limit' ? parseFloat(limitPrice) : undefined
      };
      
      const response = await api.post('/orders', orderData);
      
      // Navigate to order confirmation page
      router.push({
        pathname: '/orders/confirm',
        query: { 
          orderId: response.data.orderId,
          status: response.data.status
        }
      });
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate estimated cost/proceeds
  const calculateEstimatedTotal = () => {
    if (!shares) return 0;
    
    const price = orderType === 'market' 
      ? team.financials.currentSharePrice 
      : parseFloat(limitPrice) || 0;
      
    return parseFloat(shares) * price;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 sticky top-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Trade {team.name} Shares</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex border border-gray-300 rounded-md overflow-hidden mb-1">
            <button 
              type="button"
              onClick={() => setTradeType('buy')} 
              className={`flex-1 py-2 text-center font-medium ${
                tradeType === 'buy' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Buy
            </button>
            <button 
              type="button"
              onClick={() => setTradeType('sell')} 
              className={`flex-1 py-2 text-center font-medium ${
                tradeType === 'sell' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sell
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex border border-gray-300 rounded-md overflow-hidden mb-1">
            <button 
              type="button"
              onClick={() => setOrderType('market')} 
              className={`flex-1 py-2 text-center font-medium ${
                orderType === 'market' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Market
            </button>
            <button 
              type="button"
              onClick={() => setOrderType('limit')} 
              className={`flex-1 py-2 text-center font-medium ${
                orderType === 'limit' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Limit
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Shares
          </label>
          <input
            type="text"
            value={shares}
            onChange={handleSharesChange}
            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
          />
        </div>
        
        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Limit Price ($)
            </label>
            <input
              type="text"
              value={limitPrice}
              onChange={handleLimitPriceChange}
              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Market Price</span>
            <span className="font-medium">${team.financials.currentSharePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Estimated {tradeType === 'buy' ? 'Cost' : 'Proceeds'}</span>
            <span className="font-medium">${calculateEstimatedTotal().toFixed(2)}</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-md font-medium ${
            tradeType === 'buy' 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-red-600 text-white hover:bg-red-700'
          } ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isSubmitting 
            ? 'Processing...' 
            : `Review ${tradeType === 'buy' ? 'Purchase' : 'Sale'}`}
        </button>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>By placing this order, you agree to our Terms of Service and acknowledge that all investments involve risk.</p>
        </div>
      </form>
    </div>
  );
}