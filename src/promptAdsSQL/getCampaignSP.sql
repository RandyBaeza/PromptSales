CREATE OR REPLACE FUNCTION sp_get_campaigns(
    p_id_campaign INT DEFAULT NULL,
    p_id_organization INT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL, -- NULL: Todos, TRUE: Solo activas, FALSE: Solo inactivas
    p_search_term VARCHAR DEFAULT NULL, -- Búsqueda parcial en nombre o descripción
    p_include_deleted BOOLEAN DEFAULT FALSE -- Por defecto NO mostramos las borradas lógicamente
)
RETURNS TABLE (
    id_campaign INT,
    organization_name VARCHAR, -- Traemos el nombre de la org para evitar otra consulta
    name VARCHAR,
    description VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    ends_at TIMESTAMP,
    enabled BOOLEAN,
    status_calculated VARCHAR -- Campo calculado útil para UI (Activa, Vencida, Pendiente)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id_campaign,
        o.name AS organization_name,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        c.ends_at,
        c.enabled,
        CASE 
            WHEN c.ends_at < CURRENT_TIMESTAMP THEN 'Vencida'
            WHEN c.enabled = FALSE THEN 'Deshabilitada'
            ELSE 'Activa'
        END::VARCHAR AS status_calculated
    FROM "PACampaigns" c
    JOIN "PAOrganizations" o ON c.id_organization = o.id_organization
    WHERE 
        -- Filtro por ID específico (si se provee, ignora el resto para ser rápido)
        (p_id_campaign IS NULL OR c.id_campaign = p_id_campaign)
        
        -- Filtro por Organización
        AND (p_id_organization IS NULL OR c.id_organization = p_id_organization)
        
        -- Filtro de "Activo" (Enabled)
        AND (p_is_active IS NULL OR c.enabled = p_is_active)
        
        -- Filtro de borrado lógico
        AND (p_include_deleted = TRUE OR c.deleted = FALSE)
        
        -- Búsqueda por texto (insensible a mayúsculas/minúsculas)
        AND (p_search_term IS NULL OR 
             c.name ILIKE '%' || p_search_term || '%' OR 
             c.description ILIKE '%' || p_search_term || '%');
END;
$$;