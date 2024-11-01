'use client'

import RootLayout from './layout'
import React, { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Play, Pause, ChevronRight, Calendar, X, ChevronLeft, ChevronRight as ChevronRightIcon, Download } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Area, AreaChart, ComposedChart } from 'recharts'
import { createClient } from '@supabase/supabase-js'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subDays } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

const supabase = createClient(
  'https://mmbluqkupxdgkdkmwzvj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYmx1cWt1cHhkZ2tka213enZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0NzgwODcsImV4cCI6MjA0NTA1NDA4N30.5WwH-WwpEKMs0PPvYX0jhMfF3X5mwlFl5IfMTyW48GU'
)

const Chart = ({ data, category, dateRange, setDateRange }) => {
  const [selectedPoints, setSelectedPoints] = useState([])

  const chartData = data.filter((item) => {
    if (!dateRange || !dateRange.from || !dateRange.to) return true;
    const itemDate = new Date(item.date);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  }).map(item => ({
    name: item.name,
    value: category ? item[category.key] : item.value
  }))

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null

  const handleClick = (point) => {
    if (!point || !point.payload) return;

    const clickedPoint = {
      name: point.payload.name,
      value: point.payload.value
    };

    setSelectedPoints(prevPoints => {
      if (prevPoints.length === 0) {
        return [clickedPoint];
      } else if (prevPoints.length === 1) {
        if (clickedPoint.name === prevPoints[0].name) {
          return []; // Unselect if clicking the same point
        } else if (parseInt(clickedPoint.name) > parseInt(prevPoints[0].name)) {
          const newPoints = [prevPoints[0], clickedPoint];
          const change = ((clickedPoint.value - prevPoints[0].value) / prevPoints[0].value) * 100;
          setPercentageChange(change.toFixed(2));
          return newPoints;
        } else {
          return [clickedPoint];
        }
      } else {
        return [];
      }
    });
  }

  const CustomizedDot = ({ cx, cy, payload }) => {
    const isSelected = selectedPoints.some(point => point.name === payload.name)
    if (isSelected) {
      return (
        <circle cx={cx} cy={cy} r={6} fill={category ? category.color : "#10B981"} stroke="#FFFFFF" strokeWidth={2} />
      )
    }
    return null
  }

  const CustomizedLabel = ({ viewBox, value }) => {
    const { x, y, width } = viewBox
    return (
      <g>
        <rect x={x + width / 2 - 40} y={y - 30} width="80" height="25" fill="white" rx="4" ry="4" />
        <text x={x + width / 2} y={y - 17} fill="#111827" textAnchor="middle" dominantBaseline="middle">
          {value}%
        </text>
      </g>
    )
  }

  const formatXAxis = (tickItem) => {
    const numValue = parseInt(tickItem);
    return numValue % 5 === 0 ? numValue : '';
  };

  return (
    <Card className="backdrop-blur-md bg-white/30 rounded-xl overflow-hidden shadow-lg border border-white/40">
      <CardContent className="p-4 -ml-4">
        <div className="flex flex-col items-center mb-4">
          <span className="text-white text-xl font-semibold text-center w-full">{category ? category.label : 'Average Success'}</span>
          {!category && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                  <Download className="ml-auto h-4 w-4" onClick={(e) => { e.stopPropagation(); exportData(); }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col space-y-2 p-2">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from || new Date()}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['All Days', 'This Week', 'Last Week', 'Last 7 Days', 'This Month', 'Last 14 Days', 'Last 30 Days'].map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          let from, to;
                          switch (option) {
                            case 'All Days':
                              from = null;
                              to = null;
                              break;
                            case 'This Week':
                              from = startOfWeek(today);
                              to = endOfWeek(today);
                              break;
                            case 'Last Week':
                              from = startOfWeek(subWeeks(today, 1));
                              to = endOfWeek(subWeeks(today, 1));
                              break;
                            case 'Last 7 Days':
                              from = subDays(today, 6);
                              to = today;
                              break;
                            case 'This Month':
                              from = startOfMonth(today);
                              to = endOfMonth(today);
                              break;
                            case 'Last 14 Days':
                              from = subDays(today, 13);
                              to = today;
                              break;
                            case 'Last 30 Days':
                              from = subDays(today, 29);
                              to = today;
                              break;
                          }
                          setDateRange({ from, to });
                        }}
                        className="w-full"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="h-[300px] relative">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-white text-xl">No data available</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    handleClick(data.activePayload[0]);
                  }
                }}
              >
                <defs>
                  <linearGradient id={`colorGradient-${category ? category.key : 'overall'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={category ? category.color : "#F59E0B"} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={category ? category.color : "#F59E0B"} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={formatXAxis}
                  interval={0}
                  height={30}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', border: 'none', borderRadius: '8px', zIndex: 100 }}
                  wrapperStyle={{ zIndex: 100 }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value, name, props) => [
                    `${category ? category.label : 'Average Success'}: ${value}`,
                    `Call Record ${props.payload.name}`
                  ].reverse()}
                  labelFormatter={() => ''}
                  cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={category ? category.color : "#F59E0B"}
                  strokeWidth={3}
                  fill={`url(#colorGradient-${category ? category.key : 'overall'})`}
                  dot={<CustomizedDot />}
                  activeDot={{ r: 8, fill: category ? category.color : "#F59E0B", stroke: '#111827', strokeWidth: 2 }}
                />
                {selectedPoints.length === 2 && (
                  <ReferenceLine
                    segment={selectedPoints.map(point => ({ x: point.name, y: point.value }))}
                    stroke="white"
                    strokeWidth={2}
                    label={<CustomizedLabel value={percentageChange} />}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
          {chartData.length > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="text-lg text-gray-400 mb-1">Average Score</div>
              <div className="text-4xl font-bold" style={{ color: category ? category.color : "#F59E0B" }}>
                {Math.round(latestValue)}/100
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MainComponent() {
  const [callLogs, setCallLogs] = useState([])
  const [filteredCallLogs, setFilteredCallLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [activeModal, setActiveModal] = useState({ isOpen: false, category: null, value: null });
  const [playCallModal, setPlayCallModal] = useState({ isOpen: false, callId: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, call: null });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const scoreCategories = [
    { key: 'engagement', label: 'Engagement', color: '#6366F1' },
    { key: 'objection_handling', label: 'Objection Handling', color: '#8B5CF6' },
    { key: 'information_gathering', label: 'Information Gathering', color: '#EC4899' },
    { key: 'program_explanation', label: 'Program Explanation', color: '#14B8A6' },
    { key: 'closing_skills', label: 'Closing Skills', color: '#F59E0B' },
    { key: 'overall_effectiveness', label: 'Overall Effectiveness', color: '#10B981' },
  ]

  useEffect(() => {
    fetchCallLogs()
  }, [])

  useEffect(() => {
    filterCallLogs()
  }, [callLogs, dateRange])

  async function fetchCallLogs() {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('Call Logs')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      setCallLogs(data)
      setFilteredCallLogs(data)
    } catch (error) {
      console.error('Error fetching call logs:', error)
      setError('Failed to fetch call logs. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  function filterCallLogs() {
    if (dateRange?.from && dateRange?.to) {
      const filtered = callLogs.filter(call => {
        const callDate = new Date(call.created_at)
        return callDate >= dateRange.from && callDate <= dateRange.to
      })
      setFilteredCallLogs(filtered)
    } else {
      setFilteredCallLogs(callLogs)
    }
    setCurrentPage(1)
  }

  const handlePlayCall = (callId) => {
    setPlayCallModal({ isOpen: true, callId });
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (newTime) => {
    setCurrentTime(newTime);
  };

  const handleViewDetails = (call) => {
    setDetailsModal({ isOpen: true, call });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(filteredCallLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'call_logs_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="relative z-10 text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="relative z-10 text-white">{error}</div>
      </div>
    )
  }

  if (!filteredCallLogs || filteredCallLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-screen p-4 relative">
        <div className="backdrop-blur-xl bg-black/30 p-12 rounded-3xl border border-white/40 shadow-2xl relative z-10 max-w-2xl w-full text-center">
          <div className="text-3xl font-bold text-white mb-8">
            {dateRange?.from && dateRange?.to 
              ? `No Call Records found between ${format(dateRange.from, "MMM dd, yyyy")} and ${format(dateRange.to, "MMM dd, yyyy")}`
              : "No Call Records found"}
          </div>
          <Button 
            onClick={() => setDateRange({ from: null, to: null })}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/40 shadow-lg transition-all duration-300"
          >
            Clear Date Range
          </Button>
        </div>
      </div>
    )
  }

const chartData = filteredCallLogs.map((call, index) => ({
    name: `${index + 1}`,
    date: new Date(call.created_at).toISOString().split('T')[0],
    ...scoreCategories.reduce((acc, category) => ({
      ...acc,
      [category.key]: call[category.key]
    }), {})
  }));

  const averageSuccessData = filteredCallLogs.map((call, index) => ({
    name: `${index + 1}`,
    date: new Date(call.created_at).toISOString().split('T')[0],
    value: call.overall_effectiveness
  }));

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredCallLogs.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredCallLogs.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

 return (
    <div className="p-8 text-white min-h-screen relative">
      <div className="mb-8">
        <Chart data={averageSuccessData} dateRange={dateRange} setDateRange={setDateRange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {scoreCategories.map((category) => (
          <div key={category.key}>
            <Chart data={chartData} category={category} dateRange={dateRange} />
          </div>
        ))}
      </div>
    </div>
  );
}

const Page = () => {
  return (
    <RootLayout>
      <MainComponent />
    </RootLayout>
  );
};

export default Page;
