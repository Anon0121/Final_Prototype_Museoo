import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const DonationAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchDashboardData();
    fetchInsightsData();
    fetchTrendsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/donations/analytics/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchInsightsData = async () => {
    try {
      const response = await api.get('/api/donations/analytics/insights');
      if (response.data.success) {
        setInsightsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
    }
  };

  const fetchTrendsData = async () => {
    try {
      const response = await api.get(`/api/donations/analytics/trends?period=${dateRange}`);
      if (response.data.success) {
        setTrendsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching trends data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getDonorLevelColor = (level) => {
    switch (level) {
      case 'Major Donor': return 'text-purple-600 bg-purple-100';
      case 'Sustaining Donor': return 'text-blue-600 bg-blue-100';
      case 'Regular Donor': return 'text-green-600 bg-green-100';
      case 'Frequent Donor': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderDashboard = () => {
    if (!dashboardData) return <div className="text-center py-8">Loading dashboard...</div>;

    const { overview, recentActivity, topDonors, typeDistribution, efficiency } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fa-solid fa-gift text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Donations</h3>
                <p className="text-2xl font-bold text-gray-900">{overview.totalDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fa-solid fa-users text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Unique Donors</h3>
                <p className="text-2xl font-bold text-gray-900">{overview.uniqueDonors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fa-solid fa-peso-sign text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <i className="fa-solid fa-chart-line text-orange-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Average Donation</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.averageAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{recentActivity.last30Days.donations}</p>
              <p className="text-sm text-gray-500">New Donations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(recentActivity.last30Days.amount)}</p>
              <p className="text-sm text-gray-500">Amount Raised</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{recentActivity.last30Days.newDonors}</p>
              <p className="text-sm text-gray-500">New Donors</p>
            </div>
          </div>
        </div>

        {/* Top Donors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Donors</h3>
          <div className="space-y-3">
            {topDonors.slice(0, 5).map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{donor.donor_name}</p>
                  <p className="text-sm text-gray-500">{donor.donation_count} donations</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(donor.total_donated)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(donor.last_donation).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Type Distribution</h3>
          <div className="space-y-3">
            {typeDistribution.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-medium text-gray-900 capitalize">{type.type}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{type.count} donations</p>
                  <p className="text-sm text-gray-500">{formatCurrency(type.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!insightsData) return <div className="text-center py-8">Loading insights...</div>;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
          <p className="text-gray-700">{insightsData.summary}</p>
          <div className="mt-2 text-sm text-gray-500">
            Source: {insightsData.source}
          </div>
        </div>

        {/* Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Trends</h3>
          <ul className="space-y-2">
            {insightsData.trends.map((trend, index) => (
              <li key={index} className="flex items-start">
                <i className="fa-solid fa-arrow-trend-up text-green-500 mt-1 mr-2"></i>
                <span className="text-gray-700">{trend}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {insightsData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <i className="fa-solid fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Predictions */}
        {insightsData.predictions && insightsData.predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictions</h3>
            <ul className="space-y-2">
              {insightsData.predictions.map((prediction, index) => (
                <li key={index} className="flex items-start">
                  <i className="fa-solid fa-crystal-ball text-purple-500 mt-1 mr-2"></i>
                  <span className="text-gray-700">{prediction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Donation Specific Insights */}
        {insightsData.donationSpecific && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
            
            {insightsData.donationSpecific.donorAnalysis && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Donor Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Donors</p>
                    <p className="font-bold">{insightsData.donationSpecific.donorAnalysis.totalDonors}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Repeat Donors</p>
                    <p className="font-bold">{insightsData.donationSpecific.donorAnalysis.repeatDonors}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Repeat Rate</p>
                    <p className="font-bold">{insightsData.donationSpecific.donorAnalysis.repeatDonorPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Donation</p>
                    <p className="font-bold">{formatCurrency(insightsData.donationSpecific.donorAnalysis.averageDonation)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTrends = () => {
    if (!trendsData) return <div className="text-center py-8">Loading trends...</div>;

    return (
      <div className="space-y-6">
        {/* Trends Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trends Overview ({trendsData.period})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{trendsData.totalDonations}</p>
              <p className="text-sm text-gray-500">Total Donations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(trendsData.totalAmount)}</p>
              <p className="text-sm text-gray-500">Total Amount</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(trendsData.averageDonation)}</p>
              <p className="text-sm text-gray-500">Average Donation</p>
            </div>
          </div>
        </div>

        {/* Processing Stages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Stages</h3>
          <div className="space-y-2">
            {Object.entries(trendsData.processingStages).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900 capitalize">{stage.replace('_', ' ')}</span>
                <span className="font-bold text-blue-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Types</h3>
          <div className="space-y-2">
            {Object.entries(trendsData.typeDistribution).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900 capitalize">{type}</span>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{data.count} donations</p>
                  <p className="text-sm text-gray-500">{formatCurrency(data.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donation Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive analysis of donation patterns and trends</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Insights
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trends
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'trends' && renderTrends()}
      </div>
    </div>
  );
};

export default DonationAnalytics;




