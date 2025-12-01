import React from "react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[180px] z-50">
        {label && (
          <p className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">
            {label}
          </p>
        )}
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const displayValue = Array.isArray(entry.value) 
              ? entry.value[0] 
              : entry.value;
            
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {entry.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                  )}
                  <span className="text-sm font-medium text-gray-600">
                    {entry.name || "Value"}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {typeof displayValue === "number"
                    ? displayValue.toLocaleString()
                    : String(displayValue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
