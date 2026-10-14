# COGAs Platform — Deployment Guide

## 1. Database

Run the full schema SQL (Part 2 of the build) in Supabase SQL Editor.
It's idempotent — safe to re-run.

## 2. Storage buckets

The schema creates three private buckets:
- `task-documents`
- `client-documents`
- `agrimind-sources`

Confirm they exist in Supabase → Storage.

## 3. Edge functions

Deploy from the project root:

```powershell
supabase functions deploy send-notification-email
supabase functions deploy agrimind-embed
supabase functions deploy agrimind-query