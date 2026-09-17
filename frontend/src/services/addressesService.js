import { supabase } from '../lib/supabase';

export const addressesService = {
  async getAddressesByClientId(clientId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAddressById(id) {
    const { data, error } = await supabase
      .from('addresses')
      .select(`
        *,
        client:client_id (
          id,
          name,
          nif
        ),
        services (
          id,
          service_number,
          service_type,
          is_active,
          loyalty_end_date
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createAddress(addressData) {
    const { data, error } = await supabase
      .from('addresses')
      .insert([{
        client_id: addressData.client_id,
        street_address: addressData.street_address,
        postal_code: addressData.postal_code,
        city: addressData.city,
        is_active: addressData.is_active !== undefined ? addressData.is_active : true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAddress(id, addressData) {
    const { data, error } = await supabase
      .from('addresses')
      .update({
        street_address: addressData.street_address,
        postal_code: addressData.postal_code,
        city: addressData.city,
        is_active: addressData.is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAddress(id) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getAddressesWithServices(clientId) {
    const { data: addresses, error: addrError } = await supabase
      .from('addresses')
      .select(`
        *,
        services (
          id,
          service_number,
          service_type,
          is_active,
          cpe,
          cui,
          operator:operator_id (id, name)
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (addrError) throw addrError;
    if (!addresses || addresses.length === 0) return [];

    const addressIds = addresses.map(a => a.id);

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, address_id, service_id, numero_servico, prt, category, sale_type, status, operator_id')
      .in('address_id', addressIds)
      .order('created_at', { ascending: false });

    if (salesError) throw salesError;

    const salesByService = {};
    (sales || []).forEach(s => {
      if (s.service_id) {
        if (!salesByService[s.service_id]) salesByService[s.service_id] = [];
        salesByService[s.service_id].push(s);
      }
    });

    return addresses.map(addr => ({
      ...addr,
      services: (addr.services || []).map(svc => {
        const svcSales = salesByService[svc.id] || [];
        const latestSale = svcSales[0];
        return {
          ...svc,
          numero_servico: latestSale?.numero_servico || svc.service_number || null,
          prt: latestSale?.prt || null,
        };
      }),
    }));
  },

  async getActiveAddresses(clientId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
