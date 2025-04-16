import { useState, useEffect } from 'react';
import api from '../utils/api';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [funds, setFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.trading.getPortfolio();
      setPortfolio(response.data);
      setHoldings(response.data.holdings || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch available funds
  const fetchFunds = async () => {
    try {
      const response = await api.trading.getFunds();
      setFunds(response.data.balance);
      return response.data.balance;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch funds');
      return 0;
    }
  };

  // Add funds to account
  const addFunds = async (amount) => {
    try {
      const response = await api.trading.addFunds(amount);
      setFunds(response.data.balance);
      return response.data.balance;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add funds');
      throw err;
    }
  };

  // Place a buy/sell order
  const placeOrder = async (orderData) => {
    try {
      const response = await api.trading.placeOrder(orderData);
      // Refresh portfolio after order
      await fetchPortfolio();
      await fetchFunds();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      throw err;
    }
  };

  // Load portfolio on mount
  useEffect(() => {
    fetchPortfolio();
    fetchFunds();
  }, []);

  return {
    portfolio,
    holdings,
    funds,
    loading,
    error,
    fetchPortfolio,
    fetchFunds,
    addFunds,
    placeOrder
  };
};

export default usePortfolio; 