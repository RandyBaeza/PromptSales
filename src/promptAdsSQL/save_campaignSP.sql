CREATE OR REPLACE PROCEDURE sp_save_campaign(
    IN p_id_campaign INTEGER,
    IN p_id_organization INTEGER,
    IN p_name TEXT,
    IN p_description TEXT,  
    IN p_ends_at TIMESTAMP WITH TIME ZONE,
    IN p_enabled BOOLEAN,
    IN p_deleted BOOLEAN,
    INOUT p_result INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Validaciones Básicas
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        RAISE EXCEPTION 'El nombre de la campaña es obligatorio.';
    END IF;

    IF p_ends_at IS NOT NULL AND p_ends_at < CURRENT_TIMESTAMP THEN
        RAISE WARNING 'La fecha de finalización es anterior a la fecha actual.';
    END IF;

    -- 2. Lógica de Upsert
    IF p_id_campaign IS NULL OR p_id_campaign = 0 THEN
        INSERT INTO "PACampaigns" (
            id_organization, name, description, created_at, updated_at, ends_at, enabled, deleted
        ) VALUES (
            p_id_organization, p_name, p_description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
            p_ends_at, COALESCE(p_enabled, TRUE), COALESCE(p_deleted, FALSE)
        )
        RETURNING id_campaign INTO p_result;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM "PACampaigns" WHERE id_campaign = p_id_campaign) THEN
            RAISE EXCEPTION 'No se encontró la campaña con ID % para actualizar.', p_id_campaign;
        END IF;

        UPDATE "PACampaigns"
        SET id_organization = p_id_organization, name = p_name, description = p_description,
            updated_at = CURRENT_TIMESTAMP, ends_at = p_ends_at, enabled = p_enabled, deleted = p_deleted
        WHERE id_campaign = p_id_campaign;

        p_result := p_id_campaign;
    END IF;
END;
$$;