//pages: collector


import React, { useState } from 'react';
import { Collection, Household } from '@/entities/all';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import QRScanner from '../components/collector/QRScanner';
import WasteStatusForm from '../components/collector/WasteStatusForm';

export default function CollectorPage() {
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleQRScan = async (qrCode) => {
    setIsProcessing(true);
    try {
      // Find household by QR code
      const households = await Household.filter({ qr_code: qrCode });
      
      if (households.length === 0) {
        setMessage({
          type: 'error',
          text: Household with QR code "${qrCode}" not found. Please verify the code or register this household first.
        });
        setCurrentHousehold(null);
      } else {
        setCurrentHousehold(households[0]);
        setMessage(null);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error looking up household. Please try again.'
      });
    }
    setIsProcessing(false);
  };

  const handleSubmitCollection = async (collectionData) => {
    setIsProcessing(true);
    try {
      const pointsAwarded = collectionData.status === 'segregated' ? 5 : -2;
      
      // Create collection record
      await Collection.create({
        household_qr: currentHousehold.qr_code,
        collector_name: collectionData.collectorName,
        status: collectionData.status,
        collection_time: new Date().toISOString(),
        ward_number: currentHousehold.ward_number,
        notes: collectionData.notes,
        points_awarded: pointsAwarded
      });

      // Update household points and compliance rate
      const collections = await Collection.filter({ household_qr: currentHousehold.qr_code });
      const totalCollections = collections.length;
      const segregatedCollections = collections.filter(c => c.status === 'segregated').length;
      const complianceRate = (segregatedCollections / totalCollections) * 100;

      await Household.update(currentHousehold.id, {
        total_points: (currentHousehold.total_points || 0) + pointsAwarded,
        compliance_rate: Math.round(complianceRate)
      });

      setMessage({
        type: 'success',
        text: Collection recorded! Household points updated by ${pointsAwarded > 0 ? '+' : ''}${pointsAwarded}.
      });
      
      setCurrentHousehold(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error recording collection. Please try again.'
      });
    }
    setIsProcessing(false);
  };

  const handleCancel = () => {
    setCurrentHousehold(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Waste Collector App</h1>
          <p className="text-slate-600">Scan household QR codes and record waste segregation status</p>
        </div>

        {message && (
          <Alert className={mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <QRScanner 
          onScan={handleQRScan}
          isProcessing={isProcessing}
        />

        {currentHousehold && (
          <WasteStatusForm
            householdData={currentHousehold}
            onSubmit={handleSubmitCollection}
            onCancel={handleCancel}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}

//page: resident

import React, { useState, useEffect } from 'react';
import { Household, Collection } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, TrendingUp, Recycle, Star, MapPin, QrCode, ShoppingCart, AlertCircle, Activity } from "lucide-react";
import { format, subDays, isToday, isYesterday } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const rewardOffers = [
  { brand: "Amazon", offer: "10% off Electronics", points: 200, logoColor: "text-orange-500" },
  { brand: "Flipkart", offer: "₹150 off Fashion", points: 150, logoColor: "text-blue-600" },
  { brand: "boAt", offer: "20% off Headphones", points: 250, logoColor: "text-red-500" },
  { brand: "Myntra", offer: "Buy 1 Get 1 on select items", points: 300, logoColor: "text-pink-500" },
];

export default function ResidentPage() {
  const [qrCode, setQrCode] = useState('');
  const [householdData, setHouseholdData] = useState(null);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for QR code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlQR = urlParams.get('qr');
    if (urlQR) {
      setQrCode(urlQR);
      lookupHouseholdByCode(urlQR);
    }
  }, []);

  const lookupHouseholdByCode = async (code) => {
    setIsLoading(true);
    try {
      const households = await Household.filter({ qr_code: code });
      
      if (households.length > 0) {
        setHouseholdData(households[0]);
        const householdCollections = await Collection.filter(
          { household_qr: code }, 
          '-collection_time'
        );
        setCollections(householdCollections);
      } else {
        setHouseholdData(null);
        setCollections([]);
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
    }
    setIsLoading(false);
  };

  const lookupHousehold = async () => {
    if (!qrCode.trim()) return;
    lookupHouseholdByCode(qrCode.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    lookupHousehold();
  };

  const getRecentCollections = () => collections.slice(0, 5);
  
  const getMonthlyStats = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyCollections = collections.filter(collection => {
      const collectionDate = new Date(collection.collection_time);
      return collectionDate.getMonth() === thisMonth && collectionDate.getFullYear() === thisYear;
    });
    
    const segregated = monthlyCollections.filter(c => c.status === 'segregated').length;
    const total = monthlyCollections.length;
    
    return { segregated, total, rate: total > 0 ? Math.round((segregated / total) * 100) : 0 };
  };

  const getDailyProgressData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayCollections = collections.filter(collection => {
        const collectionDate = new Date(collection.collection_time);
        return collectionDate.toDateString() === date.toDateString();
      });
      
      const segregatedCount = dayCollections.filter(c => c.status === 'segregated').length;
      const totalPoints = dayCollections.reduce((sum, c) => sum + (c.points_awarded || 0), 0);
      
      let dayLabel;
      if (isToday(date)) dayLabel = 'Today';
      else if (isYesterday(date)) dayLabel = 'Yesterday';
      else dayLabel = format(date, 'MMM dd');

      last7Days.push({
        day: dayLabel,
        points: totalPoints,
        segregated: segregatedCount,
        collections: dayCollections.length
      });
    }
    return last7Days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resident Portal</h1>
          <p className="text-slate-600">Track your waste segregation performance and earned rewards</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-green-600" />
              Lookup Your Household
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                placeholder="Enter your household QR code (e.g., HH001)"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !qrCode.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Looking up...' : 'View My Data'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {householdData && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Total Points</CardTitle>
                    <Trophy className="w-6 h-6" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{householdData.total_points || 0}</div>
                  <p className="text-green-100">Reward Points Earned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-700">Compliance Rate</CardTitle>
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{householdData.compliance_rate || 0}%</div>
                  <p className="text-slate-600">Overall Performance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-700">This Month</CardTitle>
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{getMonthlyStats().rate}%</div>
                  <p className="text-slate-600">{getMonthlyStats().segregated}/{getMonthlyStats().total} Collections</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-700">Ward Rank</CardTitle>
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">-</div>
                  <p className="text-slate-600">In {householdData.ward_name}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Daily Progress (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <AreaChart data={getDailyProgressData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#64748b"
                            fontSize={12}
                          />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'points') return [value, 'Points'];
                              return [value, name];
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="points" 
                            stroke="#10B981" 
                            fill="#10B981" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Household Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Address</p>
                      <p className="text-slate-900">{householdData.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Resident Name</p>
                      <p className="text-slate-900">{householdData.resident_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Contact</p>
                      <p className="text-slate-900">{householdData.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Ward</p>
                      <Badge variant="outline" className="mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {householdData.ward_name} ({householdData.ward_number})
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getRecentCollections().map((collection) => (
                        <div key={collection.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {format(new Date(collection.collection_time), 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-slate-500">
                              Collected by {collection.collector_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              className={collection.status === 'segregated' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                              }
                            >
                              {collection.status === 'segregated' ? '✓ Segregated' : '✗ Mixed'}
                            </Badge>
                            <p className={text-sm mt-1 font-semibold ${collection.points_awarded > 0 ? 'text-green-600' : 'text-red-600'}}>
                              {collection.points_awarded > 0 ? '+' : ''}{collection.points_awarded} points
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {collections.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No collections recorded yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-slate-700" />
                      Your Household QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="p-4 bg-white inline-block rounded-lg border">
                      <img 
                        src={https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(householdData.qr_code)}}
                        alt={QR Code for ${householdData.qr_code}}
                        width="180"
                        height="180"
                      />
                    </div>
                    <p className="font-mono mt-4 text-slate-800 bg-slate-100 px-2 py-1 rounded">
                      {householdData.qr_code}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Present this code to the waste collector during pickup.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-green-600" />
                Redeem Your Points
              </h2>

              <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Feature Demonstration</h3>
                  <p className="text-sm">
                    This rewards section is for demonstration purposes. Real integration with these brands is not yet available but can be developed.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewardOffers.map((offer) => (
                  <Card key={offer.brand} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className={font-bold text-xl ${offer.logoColor}}>{offer.brand}</CardTitle>
                        <ShoppingCart className="w-5 h-5 text-slate-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-slate-700">{offer.offer}</p>
                    </CardContent>
                    <div className="p-4 border-t">
                      <p className="text-sm text-slate-500 mb-2">Requires: <span className="font-bold text-green-600">{offer.points} points</span></p>
                      <Button 
                        className="w-full"
                        disabled={(householdData.total_points || 0) < offer.points}
                      >
                        Redeem Offer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {qrCode && !householdData && !isLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-slate-500">
                No household found with QR code "{qrCode}". Please check your code or contact the waste management office.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

//page: dashboard

import React, { useState, useEffect } from 'react';
import { Collection, Household, Ward } from '@/entities/all';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Recycle, Users, MapPin, TrendingUp, Calendar } from "lucide-react";
import StatCard from '../components/analytics/StatCard';
import PerformanceChart from '../components/analytics/PerformanceChart';

export default function DashboardPage() {
  const [collections, setCollections] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [collectionsData, householdsData] = await Promise.all([
        Collection.list('-collection_time'),
        Household.list()
      ]);
      setCollections(collectionsData);
      setHouseholds(householdsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const getOverallStats = () => {
    const totalCollections = collections.length;
    const segregatedCount = collections.filter(c => c.status === 'segregated').length;
    const complianceRate = totalCollections > 0 ? Math.round((segregatedCount / totalCollections) * 100) : 0;
    
    // Today's collections
    const today = new Date().toDateString();
    const todayCollections = collections.filter(c => 
      new Date(c.collection_time).toDateString() === today
    ).length;

    return {
      totalCollections,
      segregatedCount,
      complianceRate,
      todayCollections,
      totalHouseholds: households.length
    };
  };

  const getWardPerformance = () => {
    const wardStats = {};
    
    collections.forEach(collection => {
      if (!wardStats[collection.ward_number]) {
        wardStats[collection.ward_number] = {
          name: Ward ${collection.ward_number},
          total: 0,
          segregated: 0
        };
      }
      
      wardStats[collection.ward_number].total++;
      if (collection.status === 'segregated') {
        wardStats[collection.ward_number].segregated++;
      }
    });

    return Object.values(wardStats).map(ward => ({
      ...ward,
      compliance_rate: ward.total > 0 ? Math.round((ward.segregated / ward.total) * 100) : 0
    })).sort((a, b) => b.compliance_rate - a.compliance_rate);
  };

  const getTopPerformers = () => {
    return households
      .filter(h => h.total_points > 0)
      .sort((a, b) => b.compliance_rate - a.compliance_rate)
      .slice(0, 10);
  };

  const getSegregationData = () => {
    const segregatedCount = collections.filter(c => c.status === 'segregated').length;
    const mixedCount = collections.filter(c => c.status === 'mixed').length;
    
    return [
      { name: 'Segregated', value: segregatedCount },
      { name: 'Mixed', value: mixedCount }
    ];
  };

  const stats = getOverallStats();
  const wardPerformance = getWardPerformance();
  const topPerformers = getTopPerformers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Municipality Dashboard</h1>
          <p className="text-slate-600">Comprehensive waste segregation analytics and insights</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Collections"
            value={stats.totalCollections}
            icon={Recycle}
            bgColor="bg-green-500"
            change="12% increase"
            changeType="up"
          />
          <StatCard
            title="Overall Compliance"
            value={${stats.complianceRate}%}
            icon={TrendingUp}
            bgColor="bg-blue-500"
            change="8% increase"
            changeType="up"
          />
          <StatCard
            title="Today's Collections"
            value={stats.todayCollections}
            icon={Calendar}
            bgColor="bg-purple-500"
            change="5% increase"
            changeType="up"
          />
          <StatCard
            title="Registered Households"
            value={stats.totalHouseholds}
            icon={Users}
            bgColor="bg-orange-500"
          />
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Ward Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="leaderboard">Top Performers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <PerformanceChart 
                data={wardPerformance}
                title="Ward Compliance Rates"
                type="bar"
              />
              <PerformanceChart 
                data={getSegregationData()}
                title="Overall Segregation Distribution"
                type="pie"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Ward Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wardPerformance.map((ward, index) => (
                    <div key={ward.name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{ward.name}</p>
                          <p className="text-sm text-slate-500">{ward.segregated}/{ward.total} collections</p>
                        </div>
                      </div>
                      <Badge 
                        className={ward.compliance_rate >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : ward.compliance_rate >= 60 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {ward.compliance_rate}% Compliance
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Performing Households
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((household, index) => (
                    <div key={household.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-500' : 'bg-slate-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{household.address}</p>
                          <p className="text-sm text-slate-500">{household.ward_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{household.total_points} points</p>
                        <p className="text-sm text-slate-500">{household.compliance_rate}% compliance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800">Best Performing Ward</h3>
                    <p className="text-green-700">
                      {wardPerformance[0]?.name || 'N/A'} leads with {wardPerformance[0]?.compliance_rate || 0}% compliance rate
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800">Needs Improvement</h3>
                    <p className="text-red-700">
                      {wardPerformance[wardPerformance.length - 1]?.name || 'N/A'} needs attention with {wardPerformance[wardPerformance.length - 1]?.compliance_rate || 0}% compliance
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Overall Trend</h3>
                    <p className="text-blue-700">
                      {stats.complianceRate}% overall compliance rate across all wards
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <h4 className="font-medium">Increase Awareness</h4>
                    <p className="text-sm text-slate-600">Focus on wards with less than 70% compliance</p>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <h4 className="font-medium">Reward Programs</h4>
                    <p className="text-sm text-slate-600">Implement monthly rewards for top performers</p>
                  </div>
                  <div className="p-3 border border-slate-200 rounded-lg">
                    <h4 className="font-medium">Collector Training</h4>
                    <p className="text-sm text-slate-600">Additional training in low-performing areas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
