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
