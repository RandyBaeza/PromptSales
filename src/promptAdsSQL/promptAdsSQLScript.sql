-- Script de creación de las tablas de Prompt Adds 
-- Base de datos en PostgreSQL

SET client_encoding = 'UTF8';

-- --------------------------------------------------------
-- Tablas Independientes (Sin FKs a otras tablas de la lista)
-- --------------------------------------------------------

CREATE TABLE "PAOrganizationStatus" (
    id_organization_status SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "PAChannels" (
    id_channel SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE "PALogTypes" (
    id_log_type SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "PALogLevels" (
    id_log_level SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE "PALogSources" (
    id_log_source SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE "PAAdStatus" (
    id_ad_status SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE "PAAdTypes" (
    id_ad_type SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE "PAUserStatus" (
    id_user_status SERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE "PAScheduleRecurrencies" (
    id_schedule_recurrency SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    interval_days INT NOT NULL
);

CREATE TABLE "PARoles" (
    id_role SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE "PAPermissions" (
    id_permission SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    code VARCHAR(20) NOT NULL UNIQUE,
    module VARCHAR(50)
);

CREATE TABLE "PACampaignTransactionTypes" (
    id_campaign_transaction_type SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE "PASubscriptions" (
    id_subscription SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE "PASubscriptionFeatures" (
    id_subscription_feature SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(200),
    data_type VARCHAR(30)
);

CREATE TABLE "PATargetPublics" (
    id_target_public SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAPublicFeatures" (
    id_public_feature SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    data_type VARCHAR(30) NOT NULL
);

-- --------------------------------------------------------
-- Tablas con Dependencias
-- --------------------------------------------------------

CREATE TABLE "PAOrganizations" (
    id_organization SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    legal_name VARCHAR(60),
    email VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    organization_status INT REFERENCES "PAOrganizationStatus"(id_organization_status)
);

CREATE TABLE "PAOrganizationContacts" (
    id_organization_contact SERIAL PRIMARY KEY,
    id_organization INT NOT NULL REFERENCES "PAOrganizations"(id_organization) ON DELETE CASCADE,
    id_channel SMALLINT NOT NULL REFERENCES "PAChannels"(id_channel),
    value VARCHAR(80) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE "PALogs" (
    id_log SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500) NOT NULL,
    computer VARCHAR(100) NOT NULL,
    username VARCHAR(50),
    id_ref1 BIGINT,
    id_ref2 BIGINT,
    value1 VARCHAR(200),
    value2 VARCHAR(200),
    id_log_type SMALLINT NOT NULL REFERENCES "PALogTypes"(id_log_type),
    id_log_level SMALLINT NOT NULL REFERENCES "PALogLevels"(id_log_level),
    id_log_source SMALLINT NOT NULL REFERENCES "PALogSources"(id_log_source),
    checksum BYTEA
);

CREATE TABLE "PAUsers" (
    id_user SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(80) NOT NULL UNIQUE,
    password_hash BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    id_user_status INT NOT NULL REFERENCES "PAUserStatus"(id_user_status),
    checksum BYTEA
);

CREATE TABLE "PAUserPerOrganization" (
    id_user_per_organization SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES "PAUsers"(id_user) ON DELETE CASCADE,
    id_organization INT NOT NULL REFERENCES "PAOrganizations"(id_organization) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PACampaigns" (
    id_campaign SERIAL PRIMARY KEY,
    id_organization INT NOT NULL REFERENCES "PAOrganizations"(id_organization) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    ends_at TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    checksum BYTEA
);

CREATE TABLE "PACampaignAds" (
    id_campaign_ad SERIAL PRIMARY KEY,
    id_campaign INT NOT NULL REFERENCES "PACampaigns"(id_campaign) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    id_ad_type INT NOT NULL REFERENCES "PAAdTypes"(id_ad_type),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    checksum BYTEA
);

CREATE TABLE "PAPublishedAds" (
    id_published_ad BIGSERIAL PRIMARY KEY,
    id_campaign_ad BIGINT NOT NULL REFERENCES "PACampaignAds"(id_campaign_ad) ON DELETE CASCADE,
    id_organization_contact INT REFERENCES "PAOrganizationContacts"(id_organization_contact),
    body TEXT,
    redirect_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    id_ad_status INT NOT NULL REFERENCES "PAAdStatus"(id_ad_status)
);

CREATE TABLE "PAAdPerformances" (
    id_ad_performance BIGSERIAL PRIMARY KEY,
    id_published_ad BIGINT NOT NULL REFERENCES "PAPublishedAds"(id_published_ad),
    budget DECIMAL(16,2) NOT NULL,
    expenses DECIMAL(16,2) NOT NULL,
    revenue DECIMAL(16,2) NOT NULL,
    -- id_ad_sentiment FK omitida: Tabla PAAdSentiments no incluida en la lista
    id_ad_sentiment SMALLINT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_last_ad_performance BIGINT REFERENCES "PAAdPerformances"(id_ad_performance),
    is_current BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAReactionsPerAd" (
    id_reaction SERIAL PRIMARY KEY,
    id_ad_performance BIGINT NOT NULL REFERENCES "PAAdPerformances"(id_ad_performance) ON DELETE CASCADE,
    -- id_reaction_type FK omitida: Tabla PAReactionTypes no incluida en la lista
    id_reaction_type SMALLINT NOT NULL,
    reaction_number BIGINT NOT NULL
);

CREATE TABLE "PAFeaturePerSubscription" (
    id_feature_per_subscription SERIAL PRIMARY KEY,
    id_subscription INT NOT NULL REFERENCES "PASubscriptions"(id_subscription) ON DELETE CASCADE,
    id_subscription_feature INT NOT NULL REFERENCES "PASubscriptionFeatures"(id_subscription_feature) ON DELETE CASCADE,
    value VARCHAR(80) NOT NULL,
    unlimited BOOLEAN NOT NULL
);

CREATE TABLE "PASchedules" (
    id_schedule SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    id_schedule_recurrency INT NOT NULL REFERENCES "PAScheduleRecurrencies"(id_schedule_recurrency),
    start_date DATE NOT NULL,
    end_date DATE,
    start_hours TIME NOT NULL,
    end_hours TIME NOT NULL,
    last_execute TIMESTAMP,
    next_execute TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE "PAAdSchedules" (
    id_ad_schedule SERIAL PRIMARY KEY,
    id_published_ad BIGINT NOT NULL REFERENCES "PAPublishedAds"(id_published_ad),
    id_schedule INT NOT NULL REFERENCES "PASchedules"(id_schedule),
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAAdBudgets" (
    id_ad_budget SERIAL PRIMARY KEY,
    id_campaign_ad BIGINT NOT NULL REFERENCES "PACampaignAds"(id_campaign_ad) ON DELETE CASCADE,
    amount DECIMAL(16,2) NOT NULL,
    -- id_currency FK omitida: Tabla PACurrencies no incluida en la lista
    id_currency SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAUserXRoles" (
    id_user_role SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES "PAUsers"(id_user) ON DELETE CASCADE,
    id_role INT NOT NULL REFERENCES "PARoles"(id_role) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    checksum BYTEA
);

CREATE TABLE "PASubscriptionPerUser" (
    id_subscription_per_user SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES "PAUsers"(id_user) ON DELETE CASCADE,
    id_subscription INT NOT NULL REFERENCES "PASubscriptions"(id_subscription),
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAPermissionXRoles" (
    id_permission INT NOT NULL REFERENCES "PAPermissions"(id_permission) ON DELETE CASCADE,
    id_role INT NOT NULL REFERENCES "PARoles"(id_role) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    checksum BYTEA,
    PRIMARY KEY (id_permission, id_role)
);

CREATE TABLE "PACampaignTransactions" (
    id_campaign_transaction SERIAL PRIMARY KEY,
    description VARCHAR(80) NOT NULL,
    amount DECIMAL(16,2) NOT NULL,
    -- id_currency FK omitida: Tabla PACurrencies no incluida en la lista
    id_currency SMALLINT NOT NULL,
    id_campaign_transaction_type INT NOT NULL REFERENCES "PACampaignTransactionTypes"(id_campaign_transaction_type),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_campaign_ad BIGINT NOT NULL REFERENCES "PACampaignAds"(id_campaign_ad) ON DELETE CASCADE,
    checksum BYTEA
);

CREATE TABLE "PAAdPublics" (
    id_campaign_public SERIAL PRIMARY KEY,
    id_campaign_ad BIGINT NOT NULL REFERENCES "PACampaignAds"(id_campaign_ad) ON DELETE CASCADE,
    id_target_public INT NOT NULL REFERENCES "PATargetPublics"(id_target_public),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE "PAPublicValues" (
    id_public_value SERIAL PRIMARY KEY,
    id_public_feature INT NOT NULL REFERENCES "PAPublicFeatures"(id_public_feature) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    min_value VARCHAR(80),
    max_value VARCHAR(80),
    value VARCHAR(80)
);

CREATE TABLE "PATargetConfigurations" (
    id_target_configuration SERIAL PRIMARY KEY,
    id_target_public INT NOT NULL REFERENCES "PATargetPublics"(id_target_public) ON DELETE CASCADE,
    id_public_value INT NOT NULL REFERENCES "PAPublicValues"(id_public_value),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);