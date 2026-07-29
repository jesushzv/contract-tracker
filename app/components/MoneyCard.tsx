import React from "react";
import { Card } from "./ui/Card";

interface MoneyCardProps {
  title: string;
  amount: number;
  currency: string;
  type?: 'neutral' | 'success' | 'warning';
}

export function MoneyCard({ title, amount, currency, type = 'neutral' }: MoneyCardProps) {
  const valueClass = {
    neutral: 'text-slate-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  }[type];

  return (
    <Card className="p-5 flex flex-col gap-1">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className={`text-2xl font-semibold tracking-tight ${valueClass}`}>
        {new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount)}
      </p>
    </Card>
  );
}
