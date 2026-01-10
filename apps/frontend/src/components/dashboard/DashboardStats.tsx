'use client';

import { DashboardStats } from '@/lib/auction-dashboard';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Bids',
      value: stats.totalBids,
      icon: '🎯',
      color: 'blue',
      description: 'All time bids placed',
    },
    {
      title: 'Active Bids',
      value: stats.activeBids,
      icon: '⚡',
      color: 'green',
      description: 'Currently active bids',
    },
    {
      title: 'Won Auctions',
      value: stats.wonAuctions,
      icon: '🏆',
      color: 'yellow',
      description: 'Auctions you won',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: '📈',
      color: 'purple',
      description: 'Bid success rate',
    },
    {
      title: 'Total Spent',
      value: `${stats.totalSpent} ETH`,
      icon: '💰',
      color: 'orange',
      description: 'Total amount spent',
    },
    {
      title: 'Total Won',
      value: `${stats.totalWon} ETH`,
      icon: '💎',
      color: 'pink',
      description: 'Total value won',
    },
    {
      title: 'Pending Refunds',
      value: stats.pendingRefunds,
      icon: '🔄',
      color: 'indigo',
      description: 'Refunds in progress',
    },
    {
      title: 'Available Claims',
      value: stats.availableClaims,
      icon: '🎁',
      color: 'teal',
      description: 'Tokens ready to claim',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'pink':
        return 'bg-pink-50 border-pink-200 text-pink-900';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-900';
      case 'teal':
        return 'bg-teal-50 border-teal-200 text-teal-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'pink': return 'text-pink-600';
      case 'indigo': return 'text-indigo-600';
      case 'teal': return 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`border rounded-lg p-6 ${getColorClasses(stat.color)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs opacity-60 mt-1">{stat.description}</p>
            </div>
            <div className={`text-2xl ${getIconColor(stat.color)}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
