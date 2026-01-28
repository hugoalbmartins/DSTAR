import { supabase } from '../lib/supabase';

export const leadContactHistoryService = {
  async getHistoryByLeadId(leadId) {
    const { data, error } = await supabase
      .from('lead_contact_history')
      .select(`
        *,
        created_by_user:created_by (
          id,
          name
        )
      `)
      .eq('lead_id', leadId)
      .order('contact_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addContactHistory(leadId, contactDate, observations, createdBy) {
    const { data, error } = await supabase
      .from('lead_contact_history')
      .insert([{
        lead_id: leadId,
        contact_date: contactDate,
        observations: observations || null,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContactHistory(id) {
    const { error } = await supabase
      .from('lead_contact_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
