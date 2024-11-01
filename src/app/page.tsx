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
  const [percentageChange, setPercentageChange] = useState(null)

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
      <h2 className="text-3xl font-bold mb-6 text-white text-center">
        CALL RECORDS
      </h2>
      <div className="space-y-6">
        {currentRecords.map((call, index) => (
          <Card className="backdrop-blur-xl bg-black/30 rounded-xl overflow-hidden shadow-lg border border-white/40">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:space-x-8">
                <div className="backdrop-blur-xl bg-black/30 p-6 md:w-1/3 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/40">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
                  <div className="flex flex-col items-center relative z-10">
                    <Avatar className="h-24 w-24 mb-4 ring-2 ring-white/10 shadow-lg">
                      <AvatarImage src={`/placeholder.svg?height=96&width=96`} alt={String(call.id)} />
                      <AvatarFallback className="text-3xl bg-gray-800 text-white">
                        {typeof call.id === 'string' ? call.id.slice(0, 2).toUpperCase() : 'NA'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {typeof call.id === 'string' ? call.id.split('@')[0].toUpperCase() : 'Unknown'}
                    </h3>
                    <p className="text-lg text-gray-400 mb-2">CALL NUMBER {indexOfFirstRecord + index + 1}</p>
                    <p className="text-sm text-gray-400 mb-4">
                      {new Date(call.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="text-6xl font-bold mb-2" style={{ color: getCategoryColor(call.overall_effectiveness) }}>
                      {call.overall_effectiveness}
                      <span className="text-2xl text-white">/100</span>
                    </div>
                    <p className="text-lg text-gray-400">Overall Effectiveness</p>
                  </div>
                  <div className="flex flex-col space-y-2 w-full mt-6 relative z-10">
                    <Button 
                      className="w-full bg-white hover:bg-white/90 text-gray-900 border-0 shadow-md transition-all duration-300 hover:shadow-lg"
                      onClick={() => handlePlayCall(call.id)}
                    >
                      <Play className="mr-2 h-4 w-4" /> Play Call
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent hover:bg-white/10 text-white border border-white/40 shadow-md transition-all duration-300 hover:shadow-lg"
                      onClick={() => handleViewDetails(call)}
                    >
                      View Details <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 md:w-2/3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full">
                    {scoreCategories.map(({ key, label }) => (
                      <div 
                        key={key} 
                        className="backdrop-blur-xl bg-black/30 p-6 rounded-2xl flex flex-col justify-center items-center overflow-hidden relative group shadow-lg cursor-pointer border border-white/40"
                        onClick={() => setActiveModal({ isOpen: true, category: key, value: call[key] })}
                      >
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="text-sm font-medium mb-2 text-center text-gray-400 uppercase tracking-wider">{label}</div>
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold" style={{ color: getCategoryColor(call[key]) }}>
                              {call[key]}
                            </span>
                            <span className="text-lg text-gray-400 ml-1">/100</span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 p-4 mt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 w-10 text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "ghost"}
            onClick={() => paginate(page)}
            className={`h-10 w-10 rounded-full ${
              currentPage === page
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-white hover:bg-white/10"
            }`}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 w-10 text-white"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
      <Dialog open={activeModal.isOpen} onOpenChange={(isOpen) => setActiveModal({ ...activeModal, isOpen })}>
        <DialogContent className="backdrop-blur-xl bg-black/30 text-white border border-white/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {activeModal.category && scoreCategories.find(c => c.key === activeModal.category)?.label}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {activeModal.category && getCategorySummary(activeModal.category, activeModal.value)}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Dialog open={playCallModal.isOpen} onOpenChange={(isOpen) => setPlayCallModal({ ...playCallModal, isOpen })}>
        <DialogContent className="backdrop-blur-xl bg-black/30 text-white border border-white/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Playing Call {playCallModal.callId}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${(currentTime / 100) * 100}%` }}
              ></div>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[currentTime]}
              onValueChange={(value) => handleTimeChange(value[0])}
              className="w-full"
            />
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={detailsModal.isOpen} onOpenChange={(isOpen) => setDetailsModal({ ...detailsModal, isOpen })}>
        <DialogContent className="backdrop-blur-xl bg-black/30 text-white border border-white/40 shadow-2xl max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Call Details</DialogTitle>
          </DialogHeader>
          {detailsModal.call && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="text-xl font-semibold mb-2">Agent Information</h3>
                <p>ID: {detailsModal.call.id}</p>
                <p>Call Number: {callLogs.findIndex(log => log.id === detailsModal.call.id) + 1}</p>
              </div>
              {scoreCategories.map(({ key, label }) => (
                <div key={key} className="backdrop-blur-xl bg-black/30 p-4 rounded-lg border border-white/40">
                  <h4 className="text-lg font-medium mb-2">{label}</h4>
                  <p className="text-3xl font-bold" style={{ color: getCategoryColor(detailsModal.call[key]) }}>
                    {detailsModal.call[key]}/100
                  </p>
                </div>
              ))}
              <div className="col-span-2 mt-4">
                <h3 className="text-xl font-semibold mb-2">Additional Information</h3>
                <p>Date: {new Date(detailsModal.call.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getCategoryColor(value) {
  if (value >= 95) return '#3B82F6' // diamond blue
  if (value >= 80) return '#10B981' // green
  if (value >= 40) return '#F59E0B' // orange
  return '#EF4444' // red
}

function getCategorySummary(category, value) {
  const summaries = {
    engagement: "Measures how well the agent connected with the customer and maintained their interest throughout the call.",
    objection_handling: "Evaluates the agent's ability to address and overcome customer concerns or objections effectively.",
    information_gathering: "Assesses how well the agent collected relevant information from the customer to understand their needs.",
    program_explanation: "Rates the agent's ability to clearly explain products, services, or programs to the customer.",
    closing_skills: "Measures the agent's effectiveness in guiding the customer towards a decision or next steps.",
    overall_effectiveness: "Provides an overall assessment of the agent's performance across all aspects of the call."
  }

  let performance = ""
  if (value >= 95) {
    performance = "Outstanding performance in this area."
  } else if (value >= 80) {
    performance = "Excellent performance in this area."
  } else if (value >= 40) {
    performance = "Good performance, but there's room for improvement."
  } else {
    performance = "Needs significant improvement. Immediate attention required."
  }

  return `${summaries[category]} ${performance}`
}

// New Page export that wraps MainComponent with RootLayout
const Page = () => {
  return (
    <RootLayout>
      <MainComponent />
    </RootLayout>
  );
};

export default Page;
