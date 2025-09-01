//components->collector-> QR_Scanner
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
