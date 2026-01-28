import React from 'react';

export const SkeletonCard = () => (
  <div className="card-leiritrix p-6 space-y-4">
    <div className="skeleton h-6 w-1/3"></div>
    <div className="skeleton h-10 w-full"></div>
    <div className="skeleton h-4 w-2/3"></div>
  </div>
);

export const SkeletonKPI = () => (
  <div className="card-leiritrix p-6 space-y-3">
    <div className="skeleton h-8 w-16"></div>
    <div className="skeleton h-10 w-24"></div>
    <div className="skeleton h-4 w-32"></div>
  </div>
);

export const SkeletonChart = () => (
  <div className="card-leiritrix p-6 space-y-4">
    <div className="skeleton h-6 w-1/4"></div>
    <div className="skeleton h-64 w-full"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card-leiritrix p-6 space-y-4">
    <div className="skeleton h-6 w-1/3"></div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-12 flex-1"></div>
          <div className="skeleton h-12 flex-1"></div>
          <div className="skeleton h-12 flex-1"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonActivity = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex gap-3 items-start">
        <div className="skeleton h-10 w-10 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-3 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);
