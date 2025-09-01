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
    return `HH${timestamp}${random}`;
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
        navigate(`${createPageUrl("Resident")}?qr=${formData.qr_code}`);
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
          navigate(`${createPageUrl("Resident")}?qr=${formData.qr_code}`);
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
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CheckCircle className={`h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
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
