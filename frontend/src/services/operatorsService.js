import { supabase } from '@/lib/supabase';

export const operatorsService = {
  async getOperators(partnerId = null, includeInactive = false) {
    if (partnerId) {
      let query = supabase
        .from('partner_operators')
        .select(`
          operators:operator_id (
            id,
            name,
            categories,
            commission_visible_to_bo,
            active,
            created_at,
            updated_at
          )
        `)
        .eq('partner_id', partnerId);

      const { data, error } = await query;
      if (error) throw error;

      let operators = data.map(item => item.operators).filter(Boolean);

      if (!includeInactive) {
        operators = operators.filter(op => op.active);
      }

      return operators.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      let query = supabase.from('operators').select(`
        *,
        partner_operators(partner_id)
      `);

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  },

  async getOperatorById(operatorId) {
    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .eq('id', operatorId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOperator(operatorData) {
    const { data, error } = await supabase
      .from('operators')
      .insert([operatorData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOperator(operatorId, operatorData) {
    const { data, error } = await supabase
      .from('operators')
      .update(operatorData)
      .eq('id', operatorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOperator(operatorId) {
    const { error } = await supabase
      .from('operators')
      .delete()
      .eq('id', operatorId);

    if (error) throw error;
  },

  async toggleOperatorActive(operatorId, active) {
    return this.updateOperator(operatorId, { active });
  },

  async getOperatorsByPartner(partnerId) {
    return this.getOperators(partnerId, false);
  },

  async getOperatorWithSales(operatorId) {
    const { data: operatorData, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('id', operatorId)
      .maybeSingle();

    if (operatorError) throw operatorError;

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('operator_id', operatorId);

    if (salesError) throw salesError;

    return {
      ...operatorData,
      sales: salesData,
      salesCount: salesData.length,
    };
  },

  async associateOperatorWithPartner(operatorId, partnerId) {
    const { data, error } = await supabase
      .from('partner_operators')
      .insert([{ partner_id: partnerId, operator_id: operatorId }])
      .select();

    if (error) throw error;
    return data;
  },

  async dissociateOperatorFromPartner(operatorId, partnerId) {
    const { error } = await supabase
      .from('partner_operators')
      .delete()
      .eq('partner_id', partnerId)
      .eq('operator_id', operatorId);

    if (error) throw error;
  },

  async getAvailableOperatorsForPartner(partnerId) {
    const allOperators = await this.getOperators(null, false);

    const { data: associations, error } = await supabase
      .from('partner_operators')
      .select('operator_id')
      .eq('partner_id', partnerId);

    if (error) throw error;

    const associatedIds = new Set(associations.map(a => a.operator_id));

    return {
      associated: allOperators.filter(op => associatedIds.has(op.id)),
      available: allOperators.filter(op => !associatedIds.has(op.id))
    };
  },
};
