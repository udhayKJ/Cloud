-- =============================================================================
-- CloudShift AI: Master Database Initialization Script
-- Executes Schema, Indexes, Views, and Seed Data in Order
-- =============================================================================

\echo '---------------------------------------------------'
\echo '1/4 Initializing Database Schema...'
\echo '---------------------------------------------------'
\i schema.sql

\echo '---------------------------------------------------'
\echo '2/4 Building Performance Indexes...'
\echo '---------------------------------------------------'
\i indexes.sql

\echo '---------------------------------------------------'
\echo '3/4 Creating Analytical Views...'
\echo '---------------------------------------------------'
\i views.sql

\echo '---------------------------------------------------'
\echo '4/4 Populating Initial Seed Data...'
\echo '---------------------------------------------------'
\i seed.sql

\echo '==================================================='
\echo ' CloudShift AI PostgreSQL Database Successfully Setup!'
\echo '==================================================='
