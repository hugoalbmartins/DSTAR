import { supabase } from '@/lib/supabase';

export const commissionsService = {
  async getOperatorSettings(operatorId, partnerId = null) {
    let query = supabase
      .from('operator_commission_settings')
      .select('*')
      .eq('operator_id', operatorId);

    if (partnerId) {
      query = query.or(`partner_id.eq.${partnerId},partner_id.is.null`);
    }

    const { data, error } = await query.order('partner_id', { nullsFirst: false });

    if (error) throw error;
    return data;
  },

  async getOperatorSettingById(settingId) {
    const { data, error } = await supabase
      .from('operator_commission_settings')
      .select('*')
      .eq('id', settingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOperatorSetting(setting) {
    const { data, error } = await supabase
      .from('operator_commission_settings')
      .insert(setting)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOperatorSetting(settingId, updates) {
    const { data, error } = await supabase
      .from('operator_commission_settings')
      .update(updates)
      .eq('id', settingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOperatorSetting(settingId) {
    const { error } = await supabase
      .from('operator_commission_settings')
      .delete()
      .eq('id', settingId);

    if (error) throw error;
  },

  async getRules(settingId) {
    const { data, error } = await supabase
      .from('operator_commission_rules')
      .select('*')
      .eq('setting_id', settingId)
      .order('sale_type')
      .order('nif_type')
      .order('loyalty_months');

    if (error) throw error;
    return data;
  },

  async createRule(rule) {
    const { data, error } = await supabase
      .from('operator_commission_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRule(ruleId, updates) {
    const { data, error } = await supabase
      .from('operator_commission_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRule(ruleId) {
    const { error } = await supabase
      .from('operator_commission_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },

  async deleteRulesBySettingId(settingId) {
    const { error } = await supabase
      .from('operator_commission_rules')
      .delete()
      .eq('setting_id', settingId);

    if (error) throw error;
  },

  async getPowerCommissionValues(ruleId) {
    const { data, error } = await supabase
      .from('power_commission_values')
      .select('*')
      .eq('rule_id', ruleId)
      .order('power_value');

    if (error) throw error;
    return data;
  },

  async createPowerCommissionValues(ruleId, powerValues) {
    const valuesToInsert = powerValues.map(pv => ({
      rule_id: ruleId,
      power_value: pv.power_value,
      seller_commission: pv.seller_commission || 0,
      partner_commission: pv.partner_commission || 0
    }));

    const { data, error } = await supabase
      .from('power_commission_values')
      .insert(valuesToInsert)
      .select();

    if (error) throw error;
    return data;
  },

  async deletePowerCommissionValuesByRuleId(ruleId) {
    const { error } = await supabase
      .from('power_commission_values')
      .delete()
      .eq('rule_id', ruleId);

    if (error) throw error;
  },

  async calculateCommission(params) {
    const {
      rule,
      monthlyValue,
      previousMonthlyValue,
      newMonthlyValue,
      saleType,
      quantity = 1,
      potencia
    } = params;

    if (!rule) return { seller: 0, partner: 0 };

    if (rule.commission_type === 'per_power') {
      if (!potencia) return { seller: 0, partner: 0 };

      const powerValues = await this.getPowerCommissionValues(rule.id);
      const powerCommission = powerValues.find(pv => pv.power_value === potencia);

      if (!powerCommission) return { seller: 0, partner: 0 };

      return {
        seller: parseFloat((powerCommission.seller_commission || 0).toFixed(2)),
        partner: parseFloat((powerCommission.partner_commission || 0).toFixed(2))
      };
    }

    let baseValue = 0;

    if (rule.calculation_method === 'fixed_per_quantity') {
      baseValue = quantity;
    } else if (rule.calculation_method === 'monthly_multiple') {
      if (saleType === 'Up_sell' || saleType === 'Cross_sell') {
        const diff = (newMonthlyValue || 0) - (previousMonthlyValue || 0);
        baseValue = Math.max(0, diff);
      } else {
        baseValue = monthlyValue || 0;
      }
    }

    const sellerCommission = rule.applies_to_seller
      ? (rule.calculation_method === 'fixed_per_quantity'
          ? rule.seller_fixed_value * baseValue
          : rule.seller_monthly_multiplier * baseValue)
      : 0;

    const partnerCommission = rule.applies_to_partner
      ? (rule.calculation_method === 'fixed_per_quantity'
          ? rule.partner_fixed_value * baseValue
          : rule.partner_monthly_multiplier * baseValue)
      : 0;

    return {
      seller: parseFloat(sellerCommission.toFixed(2)),
      partner: parseFloat(partnerCommission.toFixed(2))
    };
  },

  getNifType(nif) {
    if (!nif || nif.length < 1) return 'all';
    const firstChar = nif.charAt(0);
    if (firstChar === '5') return '5xx';
    if (['1', '2', '3'].includes(firstChar)) return '123xxx';
    return 'all';
  },

  async findApplicableRule(params) {
    const {
      operatorId,
      partnerId,
      saleType,
      clientNif,
      loyaltyMonths,
      clientCategoryId,
      clientType,
      portfolioStatus
    } = params;

    const settings = await this.getOperatorSettings(operatorId, partnerId);
    if (!settings || settings.length === 0) return null;

    const setting = settings.find(s => s.partner_id === partnerId) || settings[0];

    if (setting.commission_type === 'manual') {
      return { isManual: true, setting };
    }

    const rules = await this.getRules(setting.id);
    if (!rules || rules.length === 0) return null;

    const nifType = setting.nif_differentiation ? this.getNifType(clientNif) : 'all';

    let applicableRules = rules.filter(rule => {
      if (rule.sale_type !== saleType) return false;
      if (rule.nif_type !== 'all' && rule.nif_type !== nifType) return false;
      if (rule.depends_on_loyalty && rule.loyalty_months !== loyaltyMonths) return false;
      if (!rule.depends_on_loyalty && rule.loyalty_months !== null) return false;

      if (rule.client_type_filter !== 'all' && rule.client_type_filter !== clientType) return false;

      if (rule.portfolio_filter !== 'all') {
        if (clientType !== 'empresarial' || rule.portfolio_filter !== portfolioStatus) {
          return false;
        }
      }

      return true;
    });

    if (clientCategoryId && applicableRules.length > 0) {
      const categorySpecificRules = applicableRules.filter(rule =>
        rule.client_category_id === clientCategoryId
      );

      if (categorySpecificRules.length > 0) {
        return categorySpecificRules[0];
      }

      const generalCategoryRules = applicableRules.filter(rule =>
        rule.client_category_id === null
      );

      if (generalCategoryRules.length > 0) {
        return generalCategoryRules[0];
      }
    }

    if (applicableRules.length > 0) {
      return applicableRules[0];
    }

    const fallbackRules = rules.filter(rule => {
      if (rule.sale_type !== saleType) return false;
      if (rule.nif_type !== 'all') return false;
      if (rule.depends_on_loyalty) return false;
      if (rule.client_category_id !== null) return false;
      if (rule.client_type_filter !== 'all') return false;
      if (rule.portfolio_filter !== 'all') return false;
      return true;
    });

    return fallbackRules.length > 0 ? fallbackRules[0] : null;
  }
};
