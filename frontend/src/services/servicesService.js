import { supabase } from '../lib/supabase';

export const servicesService = {
  async getServicesByClientId(clientId) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        address:address_id (
          id,
          street_address,
          postal_code,
          city,
          client_id,
          is_active
        ),
        operator:operator_id (
          id,
          name
        )
      `)
      .eq('address.client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getServicesByAddressId(addressId) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        operator:operator_id (
          id,
          name
        )
      `)
      .eq('address_id', addressId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getServiceById(id) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        address:address_id (
          id,
          street_address,
          postal_code,
          city,
          client_id,
          is_active,
          client:client_id (
            id,
            name,
            nif,
            email,
            phone
          )
        ),
        operator:operator_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createService(serviceData) {
    const { data, error } = await supabase
      .from('services')
      .insert([{
        address_id: serviceData.address_id,
        service_number: serviceData.service_number || null,
        service_type: serviceData.service_type,
        operator_id: serviceData.operator_id || null,
        cpe: serviceData.cpe || null,
        potencia: serviceData.potencia || null,
        cui: serviceData.cui || null,
        escalao: serviceData.escalao || null,
        req: serviceData.req || null,
        loyalty_months: serviceData.loyalty_months || 0,
        loyalty_end_date: serviceData.loyalty_end_date || null,
        is_active: serviceData.is_active !== undefined ? serviceData.is_active : true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateService(id, serviceData) {
    const updateData = {
      service_number: serviceData.service_number || null,
      service_type: serviceData.service_type,
      operator_id: serviceData.operator_id || null,
      cpe: serviceData.cpe || null,
      potencia: serviceData.potencia || null,
      cui: serviceData.cui || null,
      escalao: serviceData.escalao || null,
      req: serviceData.req || null,
      loyalty_months: serviceData.loyalty_months !== undefined ? serviceData.loyalty_months : 0,
      loyalty_end_date: serviceData.loyalty_end_date || null,
      is_active: serviceData.is_active
    };

    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteService(id) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getActiveServices(clientId) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        address:address_id (
          id,
          street_address,
          postal_code,
          city,
          client_id
        ),
        operator:operator_id (
          id,
          name
        )
      `)
      .eq('address.client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getServicesNearingLoyaltyEnd(daysThreshold = 210) {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        address:address_id (
          id,
          street_address,
          postal_code,
          city,
          client_id,
          client:client_id (
            id,
            name,
            nif,
            email,
            phone
          )
        ),
        operator:operator_id (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .not('loyalty_end_date', 'is', null)
      .lte('loyalty_end_date', thresholdDate.toISOString().split('T')[0])
      .gte('loyalty_end_date', today.toISOString().split('T')[0])
      .order('loyalty_end_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateServiceLoyalty(id, activeDate, loyaltyMonths) {
    let loyaltyEndDate = null;
    if (activeDate && loyaltyMonths > 0) {
      const endDate = new Date(activeDate);
      endDate.setMonth(endDate.getMonth() + loyaltyMonths);
      loyaltyEndDate = endDate.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('services')
      .update({
        loyalty_months: loyaltyMonths,
        loyalty_end_date: loyaltyEndDate
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
