import { supabase } from '../lib/supabase';

export const leadsService = {
  async getAllLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone,
          client_type
        ),
        user:user_id (
          id,
          name
        ),
        converted_sale:converted_sale_id (
          id,
          status
        )
      `)
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLeadById(id) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone,
          client_type,
          portfolio_status
        ),
        user:user_id (
          id,
          name,
          email
        ),
        converted_sale:converted_sale_id (
          id,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getLeadsByUserId(userId) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone
        ),
        converted_sale:converted_sale_id (
          id,
          status
        )
      `)
      .eq('user_id', userId)
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLeadsByClientId(clientId) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        user:user_id (
          id,
          name
        ),
        converted_sale:converted_sale_id (
          id,
          status
        )
      `)
      .eq('client_id', clientId)
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createLead(leadData) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        client_id: leadData.client_id,
        user_id: leadData.user_id || null,
        observations: leadData.observations || null,
        sale_type: leadData.sale_type,
        alert_date: leadData.alert_date,
        status: leadData.status || 'nova'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLead(id, leadData) {
    const updateData = {
      user_id: leadData.user_id || null,
      observations: leadData.observations || null,
      sale_type: leadData.sale_type,
      alert_date: leadData.alert_date,
      status: leadData.status
    };

    if (leadData.converted_sale_id) {
      updateData.converted_sale_id = leadData.converted_sale_id;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLead(id) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async convertLeadToSale(id, saleId) {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status: 'convertida',
        converted_sale_id: saleId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone
        ),
        user:user_id (
          id,
          name
        )
      `)
      .in('status', ['nova', 'em_contacto', 'qualificada'])
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLeadAlerts(daysAhead = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone
        ),
        user:user_id (
          id,
          name
        )
      `)
      .in('status', ['nova', 'em_contacto', 'qualificada'])
      .lte('alert_date', futureDate.toISOString().split('T')[0])
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getLeadStats() {
    const { data: allLeads, error: allError } = await supabase
      .from('leads')
      .select('id, status');

    if (allError) throw allError;

    const stats = {
      total: allLeads.length,
      nova: allLeads.filter(l => l.status === 'nova').length,
      em_contacto: allLeads.filter(l => l.status === 'em_contacto').length,
      qualificada: allLeads.filter(l => l.status === 'qualificada').length,
      convertida: allLeads.filter(l => l.status === 'convertida').length,
      perdida: allLeads.filter(l => l.status === 'perdida').length,
      active: allLeads.filter(l => ['nova', 'em_contacto', 'qualificada'].includes(l.status)).length,
      conversionRate: allLeads.length > 0
        ? ((allLeads.filter(l => l.status === 'convertida').length / allLeads.length) * 100).toFixed(1)
        : 0
    };

    return stats;
  },

  async searchLeads(searchTerm) {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone
        ),
        user:user_id (
          id,
          name
        )
      `)
      .or(`observations.ilike.%${searchTerm}%,client.name.ilike.%${searchTerm}%,client.nif.ilike.%${searchTerm}%`)
      .order('alert_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async filterLeads(filters) {
    let query = supabase
      .from('leads')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif,
          email,
          phone
        ),
        user:user_id (
          id,
          name
        )
      `);

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.sale_type && filters.sale_type.length > 0) {
      query = query.in('sale_type', filters.sale_type);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.date_from) {
      query = query.gte('alert_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('alert_date', filters.date_to);
    }

    query = query.order('alert_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
};
