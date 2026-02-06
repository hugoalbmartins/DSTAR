import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export const backupService = {
  async getLastBackup() {
    const { data, error } = await supabase
      .from('sales_backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async recordBackup(userId, fileName, recordCount) {
    const { data, error } = await supabase
      .from('sales_backups')
      .insert({
        user_id: userId,
        file_name: fileName,
        record_count: recordCount
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async exportSalesToExcel(userId) {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        operators:operator_id (name),
        partners:partner_id (name)
      `)
      .order('sale_date', { ascending: false });

    if (error) throw error;

    const STATUS_LABELS = {
      em_negociacao: 'Em Negociacao',
      perdido: 'Perdido',
      pendente: 'Pendente',
      ativo: 'Ativo',
      anulado: 'Anulado'
    };

    const CATEGORY_LABELS = {
      energia: 'Energia',
      telecomunicacoes: 'Telecomunicacoes',
      paineis_solares: 'Paineis Solares'
    };

    const rows = sales.map(sale => ({
      'Data Venda': sale.sale_date || '',
      'Cliente': sale.client_name || '',
      'NIF': sale.client_nif || '',
      'Telefone': sale.client_phone || '',
      'Email': sale.client_email || '',
      'Morada': sale.street_address || '',
      'Codigo Postal': sale.postal_code || '',
      'Cidade': sale.city || '',
      'Categoria': CATEGORY_LABELS[sale.category] || sale.category || '',
      'Tipo Ativacao': sale.sale_type || '',
      'Estado': STATUS_LABELS[sale.status] || sale.status || '',
      'Operadora': sale.operators?.name || '',
      'Parceiro': sale.partners?.name || '',
      'Valor Mensal': sale.contract_value || 0,
      'Comissao Vendedor': sale.commission_seller || 0,
      'Comissao Parceiro': sale.commission_partner || 0,
      'Meses Fidelizacao': sale.loyalty_months || 0,
      'Data Ativacao': sale.active_date || '',
      'Fim Fidelizacao': sale.loyalty_end_date || '',
      'REQ': sale.req || '',
      'PRT': sale.prt || '',
      'CPE': sale.cpe || '',
      'CUI': sale.cui || '',
      'Potencia': sale.potencia || '',
      'Notas': sale.notes || '',
      'Criado Em': sale.created_at ? new Date(sale.created_at).toLocaleString('pt-PT') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `backup_vendas_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    await this.recordBackup(userId, fileName, sales.length);

    return { fileName, recordCount: sales.length };
  },

  shouldShowBackupAlert() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const isOddMonth = month % 2 !== 0;

    return day >= 3 && isOddMonth;
  },

  async needsBackupAlert() {
    if (!this.shouldShowBackupAlert()) return false;

    const dismissedKey = `backup_alert_dismissed_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(dismissedKey)) return false;

    try {
      const lastBackup = await this.getLastBackup();

      if (!lastBackup) return true;

      const lastBackupDate = new Date(lastBackup.created_at);
      const now = new Date();
      const diffDays = Math.ceil((now - lastBackupDate) / (1000 * 60 * 60 * 24));

      return diffDays > 3;
    } catch {
      return false;
    }
  },

  dismissAlert() {
    const dismissedKey = `backup_alert_dismissed_${new Date().toISOString().split('T')[0]}`;
    sessionStorage.setItem(dismissedKey, 'true');
  }
};
