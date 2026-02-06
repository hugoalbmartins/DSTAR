import { supabase } from '@/lib/supabase';

const SW_READY_TIMEOUT = 5000;

async function getSwRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export const pushNotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  },

  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async showNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') return;

    const reg = await getSwRegistration();
    if (reg) {
      reg.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        tag: options.tag || `crm-${Date.now()}`,
        data: options.data || {}
      });
    } else {
      new Notification(title, {
        body,
        icon: '/favicon.jpg',
        tag: options.tag || `crm-${Date.now()}`
      });
    }
  },

  async getPreferences(userId) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertPreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async checkLoyaltyAlerts(userId) {
    const prefs = await this.getPreferences(userId);
    if (prefs && !prefs.loyalty_alerts) return [];

    const { data: sales, error } = await supabase
      .from('sales')
      .select('id, client_name, loyalty_end_date, category')
      .eq('status', 'ativo')
      .not('loyalty_end_date', 'is', null);

    if (error) throw error;
    if (!sales) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sales.filter(sale => {
      const endDate = new Date(sale.loyalty_end_date);
      endDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).map(sale => {
      const endDate = new Date(sale.loyalty_end_date);
      endDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return { ...sale, days_remaining: diffDays };
    });
  },

  async checkLeadAlerts(userId) {
    const prefs = await this.getPreferences(userId);
    if (prefs && !prefs.lead_alerts) return [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id,
        alert_date,
        sale_type,
        client:client_id (name)
      `)
      .in('status', ['nova', 'em_contacto'])
      .lte('alert_date', tomorrowStr);

    if (error) throw error;
    return leads || [];
  },

  async processLoyaltyNotifications(userId) {
    const alerts = await this.checkLoyaltyAlerts(userId);
    if (alerts.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    for (const alert of alerts) {
      const tag = `loyalty-${alert.id}-${today}`;
      const existingKey = `notif_sent_${tag}`;

      if (sessionStorage.getItem(existingKey)) continue;

      let msg;
      if (alert.days_remaining === 0) {
        msg = `Fidelizacao de ${alert.client_name} termina HOJE!`;
      } else {
        msg = `Fidelizacao de ${alert.client_name} termina em ${alert.days_remaining} dia${alert.days_remaining > 1 ? 's' : ''}`;
      }

      await this.showNotification('Alerta de Fidelizacao', msg, {
        tag,
        data: { url: `/sales/${alert.id}` }
      });

      sessionStorage.setItem(existingKey, 'true');
    }
  },

  async processLeadNotifications(userId) {
    const alerts = await this.checkLeadAlerts(userId);
    if (alerts.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    for (const lead of alerts) {
      const tag = `lead-${lead.id}-${today}`;
      const existingKey = `notif_sent_${tag}`;

      if (sessionStorage.getItem(existingKey)) continue;

      const clientName = lead.client?.name || 'Cliente';
      const alertDate = new Date(lead.alert_date);
      const now = new Date();
      const diffDays = Math.ceil((alertDate - now) / (1000 * 60 * 60 * 24));

      let msg;
      if (diffDays < 0) {
        msg = `Alerta de lead ${clientName} vencido ha ${Math.abs(diffDays)} dia(s)`;
      } else if (diffDays === 0) {
        msg = `Lead ${clientName} tem alerta para HOJE`;
      } else {
        msg = `Lead ${clientName} tem alerta para amanha`;
      }

      await this.showNotification('Alerta de Lead', msg, {
        tag,
        data: { url: `/leads/${lead.id}/edit` }
      });

      sessionStorage.setItem(existingKey, 'true');
    }
  },

  async processAllNotifications(userId) {
    if (Notification.permission !== 'granted') return;

    try {
      await Promise.all([
        this.processLoyaltyNotifications(userId),
        this.processLeadNotifications(userId)
      ]);
    } catch (err) {
      console.error('Error processing notifications:', err);
    }
  }
};
