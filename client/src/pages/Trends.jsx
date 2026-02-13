import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Fade,
  Grow,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Analytics,
  Timeline,
  Assessment,
  ShowChart
} from '@mui/icons-material';
import axios from 'axios';

// Premium Metric Card Component
const MetricCard = ({ title, value, icon, trend, loading = false, delay = 0 }) => {
  if (loading) {
    return (
      <div className="premium-card" style={{ padding: '2rem', minHeight: '140px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={60} height={60} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={24} />
          </Box>
        </Box>
      </div>
    );
  }

  const getTrendColor = () => {
    if (trend === 'increasing') return '#10b981';
    if (trend === 'decreasing') return '#ef4444';
    return '#6b7280';
  };

  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp />;
    if (trend === 'decreasing') return <TrendingDown />;
    return <Timeline />;
  };

  return (
    <Grow in={true} timeout={600 + delay}>
      <div 
        className="premium-card" 
        style={{ 
          padding: '2rem', 
          minHeight: '140px',
          background: `linear-gradient(135deg, ${getTrendColor()}08 0%, ${getTrendColor()}15 100%)`,
          border: `1px solid ${getTrendColor()}20`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated Background */}
        <div 
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, ${getTrendColor()}05 0%, transparent 70%)`,
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${getTrendColor()} 0%, ${getTrendColor()}dd 100%)`,
              width: 60,
              height: 60,
              boxShadow: `0 8px 32px ${getTrendColor()}40`
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 28, color: 'white' } })}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800, 
                mb: 0.5,
                background: `linear-gradient(135deg, ${getTrendColor()} 0%, ${getTrendColor()}cc 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {value}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'var(--gray-600)', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.875rem'
              }}
            >
              {title}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            {React.cloneElement(getTrendIcon(), { 
              sx: { 
                fontSize: 32, 
                color: getTrendColor(),
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              } 
            })}
          </Box>
        </Box>
      </div>
    </Grow>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload;
    return (
      <div className="premium-card" style={{ padding: '1rem', minWidth: '200px' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'var(--gray-800)' }}>
          {label.split('\n')[0]}
        </Typography>
        {point?.reportName && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'var(--gray-600)' }}>
            {point.reportName}
          </Typography>
        )}
        {payload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: entry.color 
              }} 
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {entry.name}: {entry.value}
            </Typography>
          </Box>
        ))}
      </div>
    );
  }
  return null;
};

// Custom X-Axis Tick for Multi-line Labels
const CustomXAxisTick = ({ x, y, payload }) => {
  const lines = payload.value.split('\n');
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 14 + 4}
          dy={0}
          textAnchor="middle"
          fill="var(--gray-600)"
          fontSize={11}
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const Trends = () => {
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await axios.get('/api/patient/trends');
      const trendsData = response.data.trends || [];
      setTrends(trendsData);
      if (trendsData.length > 0) {
        setSelectedTrend(trendsData[0]);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!selectedTrend || !selectedTrend.points) return [];

    // Check if there are duplicate dates
    const dateCounts = {};
    selectedTrend.points.forEach(point => {
      const dateStr = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });
    const hasDuplicates = Object.values(dateCounts).some(count => count > 1);

    return selectedTrend.points.map((point, index) => {
      const dateStr = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      // Truncate report name for X-axis label (max 14-18 chars)
      let shortName = point.reportName;
      if (!shortName) {
        shortName = `Report #${index + 1}`;
      } else if (shortName.length > 16) {
        shortName = shortName.substring(0, 16) + '...';
      }
      
      // Create two-line label format
      const displayLabel = hasDuplicates && shortName 
        ? `${dateStr}\n${shortName}` 
        : dateStr;

      return {
        date: displayLabel,
        value: point.value,
        reportName: point.reportName,
        reportId: point.reportId
      };
    });
  };

  const getAssessmentColor = (assessment) => {
    switch (assessment) {
      case 'improving': return '#10b981';
      case 'concerning': return '#ef4444';
      case 'stable': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAssessmentIcon = (assessment) => {
    switch (assessment) {
      case 'improving': return <TrendingUp />;
      case 'concerning': return <TrendingDown />;
      case 'stable': return <Timeline />;
      default: return <Assessment />;
    }
  };

  const testNames = trends.map(t => t.name);
  const chartData = prepareChartData();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 50%, var(--secondary-50) 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <Container maxWidth="xl">
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'var(--gradient-health)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Trend Analysis
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--gray-600)', 
                fontWeight: 400,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Advanced analytics and predictive insights for your health metrics
            </Typography>
          </Box>
        </Fade>

        <Grow in={true} timeout={1000}>
          <div className="premium-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            {/* Biomarker Selection */}
            <Box sx={{ mb: 4 }}>
              <FormControl 
                fullWidth 
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-xl)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--primary-200)',
                    '&:hover': {
                      border: '1px solid var(--primary-300)'
                    },
                    '&.Mui-focused': {
                      border: '2px solid var(--primary-500)',
                      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)'
                    },
                    '& fieldset': { border: 'none' }
                  }
                }}
              >
                <InputLabel 
                  sx={{ 
                    color: 'var(--primary-600)',
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: 'var(--primary-700)'
                    }
                  }}
                >
                  Select Biomarker for Analysis
                </InputLabel>
                <Select
                  value={selectedTrend?.key || ''}
                  onChange={(e) => {
                    const trend = trends.find(t => t.key === e.target.value);
                    setSelectedTrend(trend);
                  }}
                  label="Select Biomarker for Analysis"
                  sx={{
                    fontWeight: 600,
                    '& .MuiSelect-icon': {
                      color: 'var(--primary-500)'
                    }
                  }}
                >
                  {trends.map((trend) => (
                    <MenuItem key={trend.key} value={trend.key} sx={{ fontWeight: 500 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShowChart sx={{ color: 'var(--primary-500)' }} />
                        {trend.name} ({trend.stats.dataPoints} points)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{ 
                  display: 'inline-block',
                  width: 80,
                  height: 80,
                  border: '6px solid var(--primary-200)',
                  borderTop: '6px solid var(--primary-500)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  mb: 3
                }} />
                <Typography variant="h6" sx={{ color: 'var(--gray-600)' }}>
                  Loading trend analysis...
                </Typography>
              </Box>
            ) : selectedTrend ? (
              <Box>
                {/* Metrics Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Trend Direction"
                      value={selectedTrend.stats.direction.charAt(0).toUpperCase() + selectedTrend.stats.direction.slice(1)}
                      icon={<TrendingUp />}
                      trend={selectedTrend.stats.direction}
                      delay={0}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Change Rate"
                      value={`${selectedTrend.stats.changeRate}%`}
                      icon={<Analytics />}
                      trend={selectedTrend.stats.changeRate > 0 ? 'increasing' : 'decreasing'}
                      delay={100}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Data Points"
                      value={selectedTrend.stats.dataPoints}
                      icon={<Timeline />}
                      trend="stable"
                      delay={200}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Unit"
                      value={selectedTrend.unit}
                      icon={<Assessment />}
                      trend="stable"
                      delay={300}
                    />
                  </Grid>
                </Grid>

                {/* Premium Chart */}
                {chartData.length > 0 && (
                  <Fade in={true} timeout={1400}>
                    <div 
                      className="premium-card" 
                      style={{ 
                        padding: '2.5rem',
                        background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)',
                        border: '1px solid var(--primary-200)'
                      }}
                    >
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 3,
                          background: 'var(--gradient-primary)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <ShowChart sx={{ color: 'var(--primary-500)' }} />
                        {selectedTrend.name}
                      </Typography>
                      
                      <Box sx={{ width: '100%', height: 400, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke="var(--gray-300)" 
                              strokeOpacity={0.5}
                            />
                            <XAxis 
                              dataKey="date" 
                              stroke="var(--gray-600)"
                              fontSize={11}
                              fontWeight={500}
                              interval={0}
                              angle={0}
                              textAnchor="middle"
                              height={60}
                              tick={<CustomXAxisTick />}
                            />
                            <YAxis 
                              stroke="var(--gray-600)"
                              fontSize={12}
                              fontWeight={500}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{
                                paddingTop: '20px',
                                fontWeight: 600
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="var(--primary-500)"
                              strokeWidth={3}
                              fill="url(#colorValue)"
                              name={`Value (${selectedTrend.unit})`}
                              dot={{ 
                                fill: 'var(--primary-500)', 
                                strokeWidth: 2, 
                                stroke: 'white',
                                r: 6
                              }}
                              activeDot={{ 
                                r: 8, 
                                fill: 'var(--primary-600)',
                                stroke: 'white',
                                strokeWidth: 3,
                                filter: 'drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4))'
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </div>
                  </Fade>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Analytics sx={{ fontSize: 80, color: 'var(--gray-300)', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'var(--gray-500)', mb: 2, fontWeight: 600 }}>
                  No Trend Data Available
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--gray-400)', maxWidth: '500px', mx: 'auto' }}>
                  Select a biomarker to view trends. You need at least 2 data points for comprehensive trend analysis.
                </Typography>
              </Box>
            )}
          </div>
        </Grow>
      </Container>
    </div>
  );
};

export default Trends;
