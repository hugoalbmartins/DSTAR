/*
  # Fix NIF Differentiation Reference in Commission Recalculation
  
  ## Problem
  The recalculate_sale_commissions function was referencing nif_differentiation
  directly in the operator_commission_rules query, but this field exists in
  operator_commission_settings table, not in operator_commission_rules.
  
  ## Solution
  Update the function to correctly reference v_setting.nif_differentiation
  instead of trying to find it in the rules table.
*/

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

  -- Buscar regra aplicavel (CORRIGIDO: usar v_setting.nif_differentiation)
  SELECT * INTO v_rule
  FROM operator_commission_rules
  WHERE setting_id = v_setting.id
    AND sale_type = v_sale.sale_type
    AND (
      (v_setting.nif_differentiation = false AND nif_type = 'all')
      OR (v_setting.nif_differentiation = true AND (
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
