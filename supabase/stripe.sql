-- OffroadWatt — Stripe Pro (issue #9)
-- Ajoute la colonne nécessaire au mapping abonnement Stripe → utilisateur Supabase.
-- À exécuter dans Supabase Dashboard → SQL Editor (sur le projet ofjpskrjlwfebaqomijm).
-- Additif et idempotent : sans risque sur les données existantes.

alter table public.profiles
  add column if not exists stripe_customer_id text;

-- Recherche rapide par client Stripe (utilisé par le webhook sur subscription.deleted/updated).
create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Rappel : le webhook (api/stripe-webhook.js) écrit dans cette table avec la clé
-- service_role (bypass RLS). Aucune policy RLS supplémentaire n'est nécessaire.
-- Le champ `plan` ('free' | 'pro') existe déjà sur `profiles`.
