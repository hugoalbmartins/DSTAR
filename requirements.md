# CRM Leiritrix - Requirements & Architecture

## Problem Statement Original
Construir CRM interno para registo de vendas. Somos uma empresa de revenda de serviços e precisamos registar as vendas que enviamos para os nossos parceiros com possibilidade de atribuição por admin das comissões aplicadas a cada contrato. Deve haver BO que gere também o registo e estado das vendas. São vendas de energias, telecomunicações e painéis solares. Energias e telecomunicações podem ser novas instalações ou refids, e devem alertar 7 meses antes do fim de fidelização para entrada em negociação. No registo de venda é colocado o prazo de fidelização, que contabiliza a partir da data de estado ativo.

## User Choices / Requirements
- **Roles**: Admin, Backoffice, Vendedor
- **Estados das vendas**: Em negociação, Perdido, Pendente, Ativo, Anulado
- **Comissões**: Definidas por Admin/BO após registo de venda
- **Dashboard**: Métricas mensais com possibilidade de extrair relatórios
- **Alertas**: Fim de fidelização apenas no dashboard (por agora)
- **Design**: Moderno/corporativo com cores Leiritrix (teal #0d474f, lime #c8f31d)
- **Logo**: Leiritrix fornecido pelo cliente

### Update v1.1 - Novas Funcionalidades
- Edição e eliminação de utilizadores
- Vendas com morada, contacto e email do CLIENTE
- Telecomunicações: campo REQ na edição
- Energias: tipo (eletricidade/gás/dual), CPE+potência, CUI+escalão
- Gestão de parceiros de negócio (nome, email, pessoa contacto, telefone)
- Parceiro obrigatório na criação de vendas
- Edição de vendas limitada: estado, data, notas, REQ (telecom)
- Filtros por estado e parceiro nas vendas

## Architecture Implemented

### Backend (FastAPI + MongoDB)
- **Auth**: JWT-based authentication with role-based access control
- **Users**: Full CRUD with Admin-only management
- **Partners**: CRUD para gestão de parceiros de negócio
- **Sales**: Full CRUD with restricted update (status, date, notes, REQ)
- **Commissions**: Admin/BO assignment to sales
- **Dashboard**: Metrics, monthly stats, loyalty alerts
- **Reports**: Filterable sales reports with CSV export

### Frontend (React + Shadcn UI + Recharts)
- **Login**: Branded login page with credentials
- **Dashboard**: Metrics cards, bar/pie charts, status summary, loyalty alerts
- **Sales**: List with filters (status, parceiro), create/edit forms, detail view
- **Partners**: CRUD para parceiros de negócio
- **Reports**: Date range picker, filters, export to CSV
- **Users**: Admin-only user management with edit/delete

### Database (MongoDB)
- **Collections**: users, sales, partners
- **Indexes**: email (users), status/category/partner_id/seller_id (sales)

## Features Completed ✅
- [x] User authentication (Admin, Backoffice, Vendedor)
- [x] User edit and delete (Admin only)
- [x] Partners CRUD (name, email, contact_person, phone)
- [x] Sales registration with client data (name, email, phone, address, NIF)
- [x] Energy sales with specific fields (type: eletricidade/gas/dual, CPE, potência, CUI, escalão)
- [x] Telecom sales with REQ field in edit
- [x] Sales edit limited to: status, active_date, notes, REQ
- [x] Sales filter by status and partner
- [x] Status management (Em negociação → Ativo → etc.)
- [x] Loyalty period tracking (starts from "Ativo" date)
- [x] 7-month loyalty alerts in dashboard
- [x] Commission assignment by Admin/BO
- [x] Monthly metrics dashboard with charts
- [x] Sales reports with date range and export CSV

## Energy Fields (Portugal)
- **Tipo de Energia**: Eletricidade, Gás, Dual
- **Potências Disponíveis**: 1.15, 2.3, 3.45, 4.6, 5.75, 6.9, 10.35, 13.8, 17.25, 20.7, 27.6, 34.5, 41.4, Outra
- **Escalões Gás**: Escalão 1, 2, 3, 4

## Next Tasks / Improvements
1. **Email notifications** for loyalty alerts (SendGrid/Resend integration)
2. **Audit log** - track changes to sales and commissions
3. **Partner report** - vendas por parceiro
4. **Bulk operations** - update multiple sales status at once
5. **Mobile optimization** - responsive sidebar improvements

## Default Credentials
- **Admin**: admin@leiritrix.pt / admin123
