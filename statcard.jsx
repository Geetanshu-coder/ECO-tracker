import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, change, changeType, bgColor }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgColor} rounded-full opacity-10`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${bgColor.replace('bg-', 'text-')}`} />
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
