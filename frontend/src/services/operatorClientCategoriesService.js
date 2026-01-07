import { supabase } from '../lib/supabase';

export const operatorClientCategoriesService = {
  async getCategories(operatorId) {
    const { data, error } = await supabase
      .from('operator_client_categories')
      .select('*')
      .eq('operator_id', operatorId)
      .order('name');

    if (error) throw error;
    return data;
  },

  async createCategory(operatorId, name) {
    const { data, error } = await supabase
      .from('operator_client_categories')
      .insert([{ operator_id: operatorId, name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(id, name) {
    const { data, error } = await supabase
      .from('operator_client_categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('operator_client_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
