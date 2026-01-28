import { supabase } from '../lib/supabase';

export const clientsService = {
  async getAllClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getClientById(id) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        addresses (
          id,
          street_address,
          postal_code,
          city,
          is_active,
          created_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getClientByNIF(nif) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('nif', nif)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: clientData.name,
        nif: clientData.nif,
        email: clientData.email || null,
        phone: clientData.phone || null,
        client_type: clientData.client_type,
        portfolio_status: clientData.portfolio_status || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateClient(id, clientData) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        email: clientData.email || null,
        phone: clientData.phone || null,
        client_type: clientData.client_type,
        portfolio_status: clientData.portfolio_status || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteClient(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async searchClients(searchTerm) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,nif.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getClientSales(clientId) {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        seller:seller_id (id, name),
        partner:partner_id (id, name),
        operator:operator_id (id, name),
        client_category:client_category_id (id, name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getClientServices(clientId) {
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
