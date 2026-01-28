import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, User, FileText } from 'lucide-react';

const activityIcons = {
  sale: CheckCircle2,
  cancelled: XCircle,
  pending: AlertCircle,
  user: User,
  document: FileText
};

const activityColors = {
  sale: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  pending: 'text-orange-600 bg-orange-50',
  user: 'text-blue-600 bg-blue-50',
  document: 'text-purple-600 bg-purple-50'
};

const RecentActivity = React.memo(({ activities = [] }) => {
  return (
    <Card className="card-leiritrix">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-bold text-[#172B4D]">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-[#172B4D]/70 text-sm text-center py-8">Nenhuma atividade recente</p>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || FileText;
              const colorClass = activityColors[activity.type] || activityColors.document;

              return (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#172B4D] truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-[#172B4D]/70 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#172B4D]/60">
                        {activity.time}
                      </span>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
});

RecentActivity.displayName = 'RecentActivity';

export default RecentActivity;
