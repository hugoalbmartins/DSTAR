import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { leadsService } from '../services/leadsService';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function LeadAlerts() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeadAlerts();
  }, []);

  const loadLeadAlerts = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadAlerts(30);
      setLeads(data);
    } catch (error) {
      console.error('Error loading lead alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilAlert = (alertDate) => {
    if (!alertDate) return { days: 0, label: '-', isPast: false };
    const today = new Date();
    const alert = new Date(alertDate);
    const diffTime = alert - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)} dias atrás`, isPast: true };
    } else if (diffDays === 0) {
      return { days: 0, label: 'Hoje', isPast: false };
    }
    return { days: diffDays, label: `${diffDays} dias`, isPast: false };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Não há leads com alertas nos próximos 30 dias</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertas de Leads ({leads.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            Ver Todas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.slice(0, 5).map((lead) => {
            const alertInfo = getDaysUntilAlert(lead.alert_date);
            return (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/leads/${lead.id}/edit`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{lead.client?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{lead.sale_type}</Badge>
                    <span className={`text-xs font-semibold ${alertInfo.isPast ? 'text-red-600' : alertInfo.days <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {alertInfo.label}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
