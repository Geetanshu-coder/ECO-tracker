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
          name: `Ward ${collection.ward_number}`,
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
            value={`${stats.complianceRate}%`}
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
