
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
    return `HH${timestamp}${random}`;
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
