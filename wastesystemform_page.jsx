//components -> collector-> WasteSystemForm

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
