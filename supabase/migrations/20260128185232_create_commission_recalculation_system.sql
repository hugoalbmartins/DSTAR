/*
  # Sistema de Recalculo Automatico de Comissoes

  1. Funcoes Criadas
    - `recalculate_sale_commissions(sale_id)` - Recalcula comissoes para uma venda especifica
    - `recalculate_all_sales_commissions()` - Recalcula comissoes para todas as vendas
    - `trigger_recalculate_commissions_on_rule_change()` - Trigger para recalcular ao alterar regras

  2. Triggers
    - Recalcula comissoes automaticamente quando:
      - Regras de comissao sao inseridas/atualizadas/deletadas
      - Valores de potencia sao inseridos/atualizados/deletados
      - Configuracoes de comissao sao alteradas

  3. Notas
    - Sistema executa em background
    - Atualiza commission_partner e commission_seller baseado nas regras atuais
    - Considera tipo de cliente, categoria, operadora, tipo de venda e potencia
*/

-- Funcao para recalcular comissoes de uma venda especifica
CREATE OR REPLACE FUNCTION recalculate_sale_commissions(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale RECORD;
  v_setting RECORD;
  v_rule RECORD;
  v_commission_partner numeric := 0;
  v_commission_seller numeric := 0;
  v_power_value RECORD;
  v_loyalty_matches boolean := false;
BEGIN
  -- Buscar dados da venda
  SELECT s.*, o.categories
  INTO v_sale
  FROM sales s
  LEFT JOIN operators o ON s.operator_id = o.id
  WHERE s.id = p_sale_id;

  IF NOT FOUND OR v_sale.operator_id IS NULL THEN
    RETURN;
  END IF;

  -- Buscar configuracao de comissao da operadora
  SELECT * INTO v_setting
  FROM operator_commission_settings
  WHERE operator_id = v_sale.operator_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND OR v_setting.commission_type = 'manual' THEN
    RETURN;
  END IF;

  -- Buscar regra aplicavel
  SELECT * INTO v_rule
  FROM operator_commission_rules
  WHERE setting_id = v_setting.id
    AND sale_type = v_sale.sale_type
    AND (
      (nif_differentiation = false AND nif_type = 'all')
      OR (nif_differentiation = true AND (
        (nif_type = '5xx' AND v_sale.client_nif LIKE '5%')
        OR (nif_type = '123xxx' AND v_sale.client_nif ~ '^[123]')
        OR nif_type = 'all'
      ))
    )
    AND (client_type_filter = 'all' OR client_type_filter = v_sale.client_type OR v_sale.client_type IS NULL)
    AND (portfolio_filter = 'all' OR portfolio_filter = v_sale.portfolio_status OR v_sale.portfolio_status IS NULL)
    AND (client_category_id IS NULL OR client_category_id = v_sale.client_category_id)
  ORDER BY
    CASE WHEN client_category_id IS NOT NULL THEN 1 ELSE 2 END,
    CASE WHEN client_type_filter != 'all' THEN 1 ELSE 2 END,
    CASE WHEN portfolio_filter != 'all' THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verificar fidelizacao
  v_loyalty_matches := NOT v_rule.depends_on_loyalty
    OR (v_rule.loyalty_months IS NULL)
    OR (v_sale.loyalty_months = v_rule.loyalty_months);

  IF NOT v_loyalty_matches THEN
    RETURN;
  END IF;

  -- Calcular comissoes baseado no tipo
  IF v_rule.commission_type = 'per_power' AND v_sale.solar_power IS NOT NULL THEN
    -- Comissao baseada em potencia
    SELECT * INTO v_power_value
    FROM power_commission_values
    WHERE rule_id = v_rule.id
      AND power_value = v_sale.solar_power::text
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      IF v_rule.applies_to_partner THEN
        v_commission_partner := COALESCE(v_power_value.partner_commission, 0);
      END IF;
      IF v_rule.applies_to_seller THEN
        v_commission_seller := COALESCE(v_power_value.seller_commission, 0);
      END IF;
    END IF;
  ELSE
    -- Comissao fixa ou baseada em multiplicador mensal
    IF v_rule.calculation_method = 'fixed_per_quantity' THEN
      IF v_rule.applies_to_partner THEN
        v_commission_partner := COALESCE(v_rule.partner_fixed_value, 0);
      END IF;
      IF v_rule.applies_to_seller THEN
        v_commission_seller := COALESCE(v_rule.seller_fixed_value, 0);
      END IF;
    ELSIF v_rule.calculation_method = 'monthly_multiple' THEN
      IF v_rule.applies_to_partner THEN
        v_commission_partner := COALESCE(v_sale.contract_value, 0) * COALESCE(v_rule.partner_monthly_multiplier, 0);
      END IF;
      IF v_rule.applies_to_seller THEN
        v_commission_seller := COALESCE(v_sale.contract_value, 0) * COALESCE(v_rule.seller_monthly_multiplier, 0);
      END IF;
    END IF;
  END IF;

  -- Atualizar a venda com as novas comissoes
  UPDATE sales
  SET
    commission_partner = v_commission_partner,
    commission_seller = v_commission_seller,
    updated_at = now()
  WHERE id = p_sale_id;

END;
$$;

-- Funcao para recalcular todas as vendas
CREATE OR REPLACE FUNCTION recalculate_all_sales_commissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_sale_id uuid;
BEGIN
  FOR v_sale_id IN
    SELECT id FROM sales WHERE status NOT IN ('anulado', 'perdido')
  LOOP
    PERFORM recalculate_sale_commissions(v_sale_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Trigger function para recalcular quando regras mudam
CREATE OR REPLACE FUNCTION trigger_recalculate_commissions_on_rule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting_id uuid;
BEGIN
  -- Determinar setting_id baseado na operacao
  IF TG_OP = 'DELETE' THEN
    v_setting_id := OLD.setting_id;
  ELSE
    v_setting_id := NEW.setting_id;
  END IF;

  -- Recalcular vendas afetadas pela configuracao
  PERFORM recalculate_sale_commissions(s.id)
  FROM sales s
  INNER JOIN operator_commission_settings ocs ON s.operator_id = ocs.operator_id
  WHERE ocs.id = v_setting_id
    AND s.status NOT IN ('anulado', 'perdido');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger para operator_commission_rules
DROP TRIGGER IF EXISTS recalculate_on_commission_rule_change ON operator_commission_rules;
CREATE TRIGGER recalculate_on_commission_rule_change
AFTER INSERT OR UPDATE OR DELETE ON operator_commission_rules
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_commissions_on_rule_change();

-- Trigger function para recalcular quando valores de potencia mudam
CREATE OR REPLACE FUNCTION trigger_recalculate_commissions_on_power_value_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule_id uuid;
BEGIN
  -- Determinar rule_id
  IF TG_OP = 'DELETE' THEN
    v_rule_id := OLD.rule_id;
  ELSE
    v_rule_id := NEW.rule_id;
  END IF;

  -- Recalcular vendas afetadas
  PERFORM recalculate_sale_commissions(s.id)
  FROM sales s
  INNER JOIN operator_commission_rules ocr ON ocr.sale_type = s.sale_type
  INNER JOIN operator_commission_settings ocs ON ocs.id = ocr.setting_id AND ocs.operator_id = s.operator_id
  WHERE ocr.id = v_rule_id
    AND s.status NOT IN ('anulado', 'perdido');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger para power_commission_values
DROP TRIGGER IF EXISTS recalculate_on_power_value_change ON power_commission_values;
CREATE TRIGGER recalculate_on_power_value_change
AFTER INSERT OR UPDATE OR DELETE ON power_commission_values
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_commissions_on_power_value_change();

-- Trigger function para recalcular quando configuracoes mudam
CREATE OR REPLACE FUNCTION trigger_recalculate_commissions_on_setting_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_operator_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_operator_id := OLD.operator_id;
  ELSE
    v_operator_id := NEW.operator_id;
  END IF;

  -- Recalcular vendas do operador
  PERFORM recalculate_sale_commissions(id)
  FROM sales
  WHERE operator_id = v_operator_id
    AND status NOT IN ('anulado', 'perdido');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger para operator_commission_settings
DROP TRIGGER IF EXISTS recalculate_on_commission_setting_change ON operator_commission_settings;
CREATE TRIGGER recalculate_on_commission_setting_change
AFTER INSERT OR UPDATE OR DELETE ON operator_commission_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_commissions_on_setting_change();

-- Comentarios
COMMENT ON FUNCTION recalculate_sale_commissions(uuid) IS 'Recalcula comissoes de uma venda especifica baseado nas regras atuais';
COMMENT ON FUNCTION recalculate_all_sales_commissions() IS 'Recalcula comissoes de todas as vendas ativas';
COMMENT ON FUNCTION trigger_recalculate_commissions_on_rule_change() IS 'Trigger para recalcular comissoes quando regras sao alteradas';
COMMENT ON FUNCTION trigger_recalculate_commissions_on_power_value_change() IS 'Trigger para recalcular comissoes quando valores de potencia sao alterados';
COMMENT ON FUNCTION trigger_recalculate_commissions_on_setting_change() IS 'Trigger para recalcular comissoes quando configuracoes sao alteradas';