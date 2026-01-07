import { supabase } from '@/lib/supabase';

export const partnersService = {
  async getPartners(includeInactive = false) {
    let query = supabase.from('partners').select('*');

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getPartnerById(partnerId) {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createPartner(partnerData) {
    const { data, error } = await supabase
      .from('partners')
      .insert([partnerData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePartner(partnerId, partnerData) {
    const { data, error } = await supabase
      .from('partners')
      .update(partnerData)
      .eq('id', partnerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePartner(partnerId) {
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partnerId);

    if (error) throw error;
  },

  async togglePartnerActive(partnerId, active) {
    return this.updatePartner(partnerId, { active });
  },

  async getPartnerWithSales(partnerId) {
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerError) throw partnerError;

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('partner_id', partnerId);

    if (salesError) throw salesError;

    return {
      ...partnerData,
      sales: salesData,
      salesCount: salesData.length,
    };
  },

  async getPartnersByOperator(operatorId, includeInactive = false) {
    let query = supabase
      .from('partners')
      .select(`
        *,
        partner_operators!inner(operator_id)
      `)
      .eq('partner_operators.operator_id', operatorId);

    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data;
  },
};
