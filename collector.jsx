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

//page: Household


import React, { useState, useEffect } from 'react';
import { Household, Ward } from '@/entities/all';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState([]);
  const [filteredHouseholds, setFilteredHouseholds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHousehold, setNewHousehold] = useState({
    qr_code: '',
    address: '',
    ward_number: '',
    ward_name: '',
    resident_name: '',
    phone_number: ''
  });

  useEffect(() => {
    loadHouseholds();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredHouseholds(households);
    } else {
      const filtered = households.filter(household =>
        household.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.ward_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.resident_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHouseholds(filtered);
    }
  }, [searchTerm, households]);

  const loadHouseholds = async () => {
    setIsLoading(true);
    try {
      const data = await Household.list('-created_date');
      setHouseholds(data);
    } catch (error) {
      console.error('Error loading households:', error);
    }
    setIsLoading(false);
  };

  const handleAddHousehold = async (e) => {
    e.preventDefault();
    try {
      await Household.create({
        ...newHousehold,
        total_points: 0,
        compliance_rate: 0
      });
      
      setNewHousehold({
        qr_code: '',
        address: '',
        ward_number: '',
        ward_name: '',
        resident_name: '',
        phone_number: ''
      });
      setShowAddDialog(false);
      loadHouseholds();
    } catch (error) {
      console.error('Error adding household:', error);
    }
  };

  const generateQRCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return HH${timestamp}${random};
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Household Management</h1>
            <p className="text-slate-600">Register and manage household QR codes for waste tracking</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Household
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Household</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddHousehold} className="space-y-4">
                <div>
                  <Label htmlFor="qr_code">QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr_code"
                      value={newHousehold.qr_code}
                      onChange={(e) => setNewHousehold({...newHousehold, qr_code: e.target.value})}
                      placeholder="HH001"
                      required
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setNewHousehold({...newHousehold, qr_code: generateQRCode()})}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newHousehold.address}
                    onChange={(e) => setNewHousehold({...newHousehold, address: e.target.value})}
                    placeholder="Complete address"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ward_number">Ward Number</Label>
                    <Input
                      id="ward_number"
                      value={newHousehold.ward_number}
                      onChange={(e) => setNewHousehold({...newHousehold, ward_number: e.target.value})}
                      placeholder="001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ward_name">Ward Name</Label>
                    <Input
                      id="ward_name"
                      value={newHousehold.ward_name}
                      onChange={(e) => setNewHousehold({...newHousehold, ward_name: e.target.value})}
                      placeholder="Central Ward"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="resident_name">Resident Name</Label>
                  <Input
                    id="resident_name"
                    value={newHousehold.resident_name}
                    onChange={(e) => setNewHousehold({...newHousehold, resident_name: e.target.value})}
                    placeholder="Primary resident name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={newHousehold.phone_number}
                    onChange={(e) => setNewHousehold({...newHousehold, phone_number: e.target.value})}
                    placeholder="Contact number"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Register Household
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Households
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by address, QR code, ward, or resident name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredHouseholds.map((household) => (
            <Card key={household.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-mono text-sm font-semibold">{household.qr_code}</span>
                    </div>
                    <p className="font-medium">{household.address}</p>
                    {household.resident_name && (
                      <p className="text-sm text-slate-500">{household.resident_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Badge variant="outline" className="mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {household.ward_name} ({household.ward_number})
                    </Badge>
                    {household.phone_number && (
                      <p className="text-sm text-slate-600">{household.phone_number}</p>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{household.total_points}</div>
                    <p className="text-sm text-slate-500">Points Earned</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      household.compliance_rate >= 80 ? 'text-green-600' : 
                      household.compliance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {household.compliance_rate}%
                    </div>
                    <p className="text-sm text-slate-500">Compliance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredHouseholds.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">
                  {searchTerm ? 'No households found matching your search' : 'No households registered yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

//page: welcome

import React, { useState } from 'react';
import { Household } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Recycle, User, Phone, MapPin, QrCode, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    qr_code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const generateQRCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return HH${timestamp}${random};
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Check if household with this QR code already exists
      const existingHouseholds = await Household.filter({ qr_code: formData.qr_code });
      
      if (existingHouseholds.length > 0) {
        // Household exists, redirect to resident portal
        navigate(${createPageUrl("Resident")}?qr=${formData.qr_code});
      } else {
        // Create new household
        await Household.create({
          qr_code: formData.qr_code,
          address: formData.address,
          ward_number: "001", // Default ward - can be updated later
          ward_name: "General Ward",
          resident_name: formData.name,
          phone_number: formData.mobile,
          total_points: 0,
          compliance_rate: 0
        });

        setMessage({
          type: 'success',
          text: 'Account created successfully! Welcome to EcoTrack.'
        });

        // Redirect to resident portal after 2 seconds
        setTimeout(() => {
          navigate(${createPageUrl("Resident")}?qr=${formData.qr_code});
        }, 2000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Something went wrong. Please try again.'
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to EcoTrack</h1>
          <p className="text-slate-600">Join the smart waste management revolution</p>
        </div>

        {message && (
          <Alert className={mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}}>
            <CheckCircle className={h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}} />
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-slate-900">Register Your Household</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="Enter your mobile number"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4" />
                  House Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your complete address"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr_code" className="flex items-center gap-2 text-slate-700">
                  <QrCode className="w-4 h-4" />
                  Your QR Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="qr_code"
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => handleInputChange('qr_code', e.target.value)}
                    placeholder="Enter or generate QR code"
                    required
                    className="h-11"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleInputChange('qr_code', generateQRCode())}
                    className="h-11"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  This unique code will be used by collectors to track your waste segregation
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Setting up your account...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="text-center text-sm text-slate-600">
                <p>Already have an account?</p>
                <p className="mt-1">Use your QR code in the <span className="font-semibold text-green-600">Resident Portal</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>By joining EcoTrack, you're contributing to a cleaner, greener future</p>
        </div>
      </div>
    </div>
  );
}

// components-> collector -> QRScanner

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Scan, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function QRScanner({ onScan, isProcessing }) {
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCamera]);

  // Simulate QR code detection (in real app, would use QR library)
  const simulateQRDetection = () => {
    const codes = ['HH001', 'HH002', 'HH003', 'HH004', 'HH005'];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    onScan(randomCode);
    setShowCamera(false);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Scan className="w-5 h-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setShowCamera(true)}
              className="h-16 bg-green-600 hover:bg-green-700 text-white"
              disabled={isProcessing}
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan QR Code
            </Button>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter QR Code manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isProcessing}
              />
              <Button 
                type="submit" 
                variant="outline"
                disabled={!manualCode.trim() || isProcessing}
              >
                <Check className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Household QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    Loading camera...
                  </div>
                </div>
              )}
              
              {/* QR Code targeting overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-slate-600">
              Position the QR code within the frame to scan
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCamera(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={simulateQRDetection}
                disabled={!isCameraReady}
                className="bg-green-600 hover:bg-green-700"
              >
                Simulate Scan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

//components-> collector -> WasteStatusForm


import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle, Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WasteStatusForm({ 
  householdData, 
  onSubmit, 
  isProcessing, 
  onCancel 
}) {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [collectorName, setCollectorName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      status,
      notes,
      collectorName
    });
  };

  if (!householdData) return null;

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2">
          <Recycle className="w-5 h-5 text-green-600" />
          Record Waste Collection
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Household</p>
            <p className="text-slate-600">{householdData.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Ward</p>
            <Badge variant="outline" className="mt-1">
              {householdData.ward_name} ({householdData.ward_number})
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-4 block">
              Waste Segregation Status
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus("segregated")}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  status === "segregated" 
                    ? "border-green-500 bg-green-50 text-green-700" 
                    : "border-slate-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="font-semibold">Properly Segregated</div>
                <div className="text-sm opacity-75">+5 points</div>
              </button>

              <button
                type="button"
                onClick={() => setStatus("mixed")}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  status === "mixed" 
                    ? "border-red-500 bg-red-50 text-red-700" 
                    : "border-slate-200 hover:border-red-300 hover:bg-red-50"
                }`}
              >
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <div className="font-semibold">Mixed/Not Segregated</div>
                <div className="text-sm opacity-75">-2 points</div>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="collectorName">Collector Name</Label>
            <Input
              id="collectorName"
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or issues..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!status || !collectorName || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Record Collection
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

//Components -> analytics -> PerformanceChart

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const COLORS = ['#10B981', '#EF4444'];

export default function PerformanceChart({ data, type = "bar", title }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTooltip = (value, name) => {
    if (name === 'compliance_rate') {
      return [${value}%, 'Compliance Rate'];
    }
    return [value, name.replace('_', ' ')];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {data[0]?.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {data[0]?.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="compliance_rate" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => ${name} ${(percent * 100).toFixed(0)}%}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={cell-${index}} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
//Components -> analytics -> Statcard

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, change, changeType, bgColor }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgColor} rounded-full opacity-10} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className={h-5 w-5 ${bgColor.replace('bg-', 'text-')}} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {change && (
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
            {changeType === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={changeType === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change}
            </span>
            <span>from last week</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

//Layout.js

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Recycle, Scan, Trophy, BarChart3, Users, MapPin, UserPlus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Get Started",
    url: createPageUrl("Welcome"),
    icon: UserPlus,
    description: "Register Your Household"
  },
  {
    title: "Collector App",
    url: createPageUrl("Collector"),
    icon: Scan,
    description: "QR Code Scanning"
  },
  {
    title: "Resident Portal",
    url: createPageUrl("Resident"),
    icon: Trophy,
    description: "View Rewards & Points"
  },
  {
    title: "Municipality Dashboard",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
    description: "Analytics & Insights"
  },
  {
    title: "Household Management",
    url: createPageUrl("Households"),
    icon: Users,
    description: "Manage Households"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-green-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">EcoTrack</h2>
                <p className="text-xs text-slate-500">Smart Waste Management</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Applications
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-green-50 text-green-700 border-l-4 border-green-500' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <div>
                            <span className="font-semibold text-sm">{item.title}</span>
                            <p className="text-xs text-slate-500">{item.description}</p>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Recycle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Today's Collections</p>
                      <p className="text-xs text-slate-500">Track daily progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Ward Performance</p>
                      <p className="text-xs text-slate-500">Monitor compliance</p>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-600 font-semibold text-sm">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">Admin User</p>
                <p className="text-xs text-slate-500 truncate">Waste Management System</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">EcoTrack</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
