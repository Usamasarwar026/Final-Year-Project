"use client";
// src/modules/reports/components/StatCard.tsx
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  sub?: string;
  subColor?: string;
  loading?: boolean;
  cardBg?: string;
  index?: number;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
  subColor = "text-gray-500",
  loading = false,
  cardBg,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow ${cardBg}`}>
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
          {label}
        </p>
        {loading ? (
          <div className="h-7 w-24 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">
            {value}
          </p>
        )}
        {sub && !loading && (
          <p className={`text-xs mt-0.5 truncate ${subColor}`}>{sub}</p>
        )}
      </div>
    </motion.div>
  );
}
