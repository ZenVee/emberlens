-- Migration: add Completed booking status
alter type public.booking_status add value if not exists 'Completed';
