-- Seed data for local database testing (Freelancer & Contracts)

-- 1. Insert Default Freelancer Profile
INSERT INTO public.profiles (id, email, full_name, rfc, regimen_fiscal, codigo_postal, bank_details)
VALUES (
    'd8b67104-e3c3-4d37-88ab-8c9df4a2e5d9', 
    'hector@freelancemx.dev', 
    'Héctor J. Guerrero', 
    'GUEH860710MX8', 
    '626 - Régimen Simplificado de Confianza (RESICO)', 
    '06700', 
    '{"clabe": "012180001509987654", "bankName": "BBVA México", "beneficiaryName": "Héctor J. Guerrero"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- 2. Insert Active Contract (Sofia Garza)
INSERT INTO public.contracts (
    id, freelancer_id, client_name, client_email, client_rfc, client_regimen, client_postal, 
    scope_description, total_amount, currency, status, clabe, bank_name, beneficiary_name, 
    freelancer_rfc, freelancer_regimen, freelancer_postal, created_at, updated_at
)
VALUES (
    'c-1001-sofia-garza', 
    'd8b67104-e3c3-4d37-88ab-8c9df4a2e5d9', 
    'Sofía Garza (Studio Flora)', 
    'sofia@studioflora.mx', 
    'GASF920412HX8',
    '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    '06700',
    'Rediseño completo de la identidad de marca, incluyendo logotipo, paleta de colores, tipografías y manual de identidad gráfica para Studio Flora.',
    30000.00,
    'MXN',
    'accepted',
    '012180001509987654',
    'BBVA México',
    'Héctor J. Guerrero',
    'GUEH860710MX8',
    '626 - Régimen Simplificado de Confianza (RESICO)',
    '06700',
    now() - interval '3 days',
    now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Milestones for Sofia Garza
INSERT INTO public.milestones (id, contract_id, label, amount, due_date, status, created_at)
VALUES 
(
    'm-1001-1', 
    'c-1001-sofia-garza', 
    'Anticipo de inicio (50%)', 
    15000.00, 
    (now() - interval '2 days')::date, 
    'requested', 
    now() - interval '3 days'
),
(
    'm-1001-2', 
    'c-1001-sofia-garza', 
    'Entrega de manual final (50%)', 
    15000.00, 
    (now() + interval '10 days')::date, 
    'pending', 
    now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;
