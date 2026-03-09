-- ============================================================
-- Script para criar utilizador test@tester.pt no auth.users
-- ============================================================
-- Este script deve ser executado por um administrador do Supabase
-- com acesso ao dashboard ou através da API de administração
--
-- Utilizador: test@tester.pt
-- Password: Crm2026*
-- Role: admin
-- Hidden: true (oculto dos outros utilizadores)
--
-- NOTA: O registo em public.users já foi criado pela migration
-- ============================================================

-- Verificar se o utilizador já existe em auth.users
SELECT id, email FROM auth.users WHERE email = 'test@tester.pt';

-- Se não existir, criar usando a função admin (requer service_role):
-- Nota: Esta é a query SQL que seria executada internamente.
-- Na prática, deve usar o Supabase Dashboard > Authentication > Add User
-- ou usar a API Admin com o seguinte curl:

/*
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tester.pt",
    "password": "Crm2026*",
    "email_confirm": true,
    "user_metadata": {
      "name": "Test Admin"
    },
    "app_metadata": {
      "role": "admin"
    }
  }'
*/

-- OU execute este código JavaScript no contexto do servidor:
/*
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@tester.pt',
    password: 'Crm2026*',
    email_confirm: true,
    user_metadata: {
      name: 'Test Admin'
    }
  });

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Utilizador criado com sucesso:', data);

    // Atualizar o ID na tabela public.users se necessário
    const { error: updateError } = await supabase
      .from('users')
      .update({ id: data.user.id })
      .eq('email', 'test@tester.pt');

    if (updateError) {
      console.error('Erro ao atualizar public.users:', updateError);
    }
  }
}

createTestUser();
*/
