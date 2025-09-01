
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
          text: `Household with QR code "${qrCode}" not found. Please verify the code or register this household first.`
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
        text: `Collection recorded! Household points updated by ${pointsAwarded > 0 ? '+' : ''}${pointsAwarded}.`
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
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
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
