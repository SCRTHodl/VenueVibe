import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Sparkles, TrendingUp, BarChart3, PieChart, Filter, RefreshCw } from 'lucide-react';
import { getAggregatedMetrics } from '../../lib/ai/contentMetrics';

interface PerformanceMetrics {
  topPerforming: Array<{
    content_id: string;
    content_name: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
}

export const AIContentPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [contentType, setContentType] = useState<string | undefined>(undefined);
  const [chartData, setChartData] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  
  // Load available content types
  useEffect(() => {
    const fetchContentTypes = async () => {
      const { data, error } = await supabase
        .from('featured_content')
        .select('content_type')
        .limit(20);
        
      if (error) {
        console.error('Error fetching content types:', error);
      } else if (data) {
        // Get unique content types
        const types = [...new Set(data.map(item => item.content_type))];
        setContentTypes(types);
      }
    };
    
    fetchContentTypes();
  }, []);
  
  // Load performance metrics
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const metricsData = await getAggregatedMetrics({
          contentType,
          timeframe,
          limit: 10
        });
        
        if (metricsData) {
          setMetrics(metricsData);
          
          // Prepare chart data
          const chartData = metricsData.topPerforming.map(item => ({
            name: item.content_name.length > 20 
              ? item.content_name.substring(0, 20) + '...' 
              : item.content_name,
            impressions: item.impressions,
            clicks: item.clicks,
            ctr: item.ctr
          }));
          
          setChartData(chartData);
        }
      } catch (err) {
        console.error('Error loading performance metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, [contentType, timeframe]);
  
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={24} className="text-purple-500" />
          <h2 className="text-xl font-semibold">AI Content Performance</h2>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <select
              className="bg-gray-800 text-white pl-8 pr-3 py-2 rounded-md text-sm"
              value={contentType || ''}
              onChange={(e) => setContentType(e.target.value || undefined)}
            >
              <option value="">All Content Types</option>
              {contentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <TrendingUp className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <select
              className="bg-gray-800 text-white pl-8 pr-3 py-2 rounded-md text-sm"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <button 
            className="p-2 bg-gray-800 text-white rounded-md"
            onClick={() => setTimeframe(timeframe)}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <Sparkles size={16} />
                <h3 className="text-sm font-medium">Total Impressions</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics?.totalImpressions.toLocaleString() || 0}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <TrendingUp size={16} />
                <h3 className="text-sm font-medium">Total Clicks</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics?.totalClicks.toLocaleString() || 0}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <PieChart size={16} />
                <h3 className="text-sm font-medium">Average CTR</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics?.averageCTR.toFixed(2) || 0}%</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing Content */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white text-lg font-semibold mb-4">Top Performing Content</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" tick={{ fill: '#fff' }} />
                      <YAxis tick={{ fill: '#fff' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#222', border: 'none' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    No data available
                  </div>
                )}
              </div>
            </div>
            
            {/* CTR Comparison */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white text-lg font-semibold mb-4">CTR Comparison</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" tick={{ fill: '#fff' }} />
                      <YAxis tick={{ fill: '#fff' }} domain={[0, 'dataMax']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#222', border: 'none' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="ctr" 
                        stroke="#ff7300" 
                        name="CTR (%)" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Top Performing Content Table */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white text-lg font-semibold mb-4">Top Performing Content</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 rounded-tl-lg">Content</th>
                    <th className="p-3">Impressions</th>
                    <th className="p-3">Clicks</th>
                    <th className="p-3 rounded-tr-lg">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.topPerforming.map((item, index) => (
                    <tr key={item.content_id} className={index % 2 === 0 ? 'bg-gray-900/50' : ''}>
                      <td className="p-3">{item.content_name}</td>
                      <td className="p-3">{item.impressions.toLocaleString()}</td>
                      <td className="p-3">{item.clicks.toLocaleString()}</td>
                      <td className="p-3">{item.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                  {metrics?.topPerforming.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
