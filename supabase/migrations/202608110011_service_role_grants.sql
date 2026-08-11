-- service_role needs full table access: the app's server-side admin client
-- reads/writes directly with the service key. Column-privacy grants only
-- apply to the authenticated (user) role.
grant all on all tables in schema public to service_role;