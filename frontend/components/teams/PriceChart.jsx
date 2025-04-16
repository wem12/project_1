import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import api from '../../utils/api';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

// Register Chart.js components
Chart.register(...registerables);

const PriceChart = ({ teamId }) => {
  const [priceData, setPriceData] = useState(null);
  const [timeframe, setTimeframe] = useState('1M'); // 1D, 1W, 1M, 3M, 1Y, ALL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeframeOptions = [
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'ALL' }
  ];

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.teams.getPriceHistory(teamId, timeframe);
        setPriceData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load price history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [teamId, timeframe]);

  const formatChartData = () => {
    if (!priceData || !priceData.prices) return null;
    
    return {
      labels: priceData.prices.map(point => new Date(point.timestamp).toLocaleDateString()),
      datasets: [
        {
          label: 'Share Price ($)',
          data: priceData.prices.map(point => point.price),
          fill: false,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    }
  };

  const chartData = formatChartData();

  return (
    <Card title="Share Price History">
      <div className="mb-4 flex justify-end space-x-2">
        {timeframeOptions.map(option => (
          <button
            key={option.value}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === option.value 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setTimeframe(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
      
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && chartData && (
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
      
      {priceData && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Current Price</p>
            <p className="text-xl font-bold text-gray-800">${priceData.currentPrice?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">24h Change</p>
            <p className={`text-xl font-bold ${
              priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceData.change24h >= 0 ? '+' : ''}{priceData.change24h?.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="text-xl font-bold text-gray-800">
              ${(priceData.marketCap / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

PriceChart.propTypes = {
  teamId: PropTypes.string.isRequired
};

export default PriceChart; 