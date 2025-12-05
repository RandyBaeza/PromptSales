INSERT INTO "PAOrganizationStatus" (name) 
VALUES ('Activa'), ('Inactiva')
ON CONFLICT (name) DO NOTHING;

INSERT INTO "PAOrganizations" (name, legal_name, email, organization_status)
VALUES 
    ('Empresa Demo A', 'Demo A S.A.', 'contacto@demoa.com', 1),
    ('Marketing Global', 'Mkt Global LLC', 'info@mktglobal.com', 1),
    ('Tech Solutions', 'Tech Soluciones Ltda', 'admin@techsol.com', 1)
ON CONFLICT DO NOTHING;


DO $$
DECLARE
    v_org_id INT;
    v_counter INT := 1;
    v_random_days INT;
    v_campaign_name VARCHAR;
    v_result INT;
BEGIN
    WHILE v_counter <= 100 LOOP
        
        -- Seleccionar un ID de organización aleatorio
        SELECT id_organization INTO v_org_id 
        FROM "PAOrganizations" 
        ORDER BY RANDOM() 
        LIMIT 1;

        -- Generar días aleatorios (-30 a +90)
        v_random_days := FLOOR(RANDOM() * 120) - 30;

        -- Nombre de campaña aleatorio
        v_campaign_name := 'Campaña ' ||
            (ARRAY['Verano','Invierno','Lanzamiento','Promo','Black Friday','Navidad'])
                [FLOOR(RANDOM() * 6)::INT + 1] 
            || ' ' || v_counter;

        -- Llamar al SP con el parámetro INOUT final
        CALL sp_save_campaign(
            NULL,                       -- p_id_campaign
            v_org_id,                   -- p_id_organization
            v_campaign_name,            -- p_name
            'Descripción generada automáticamente para la campaña ' || v_counter,
            CURRENT_TIMESTAMP + (v_random_days || ' days')::INTERVAL,
            (RANDOM() > 0.1),           -- enabled (90% activas)
            (RANDOM() < 0.05),          -- deleted (5% borradas)
            v_result                    -- INOUT
        );

        v_counter := v_counter + 1;
    END LOOP;

    RAISE NOTICE 'Se han insertado 1000 campañas exitosamente.';
END $$;
