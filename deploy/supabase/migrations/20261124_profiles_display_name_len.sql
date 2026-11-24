-- Board nicknames (daily-quiz function, POST /name): 2 to 24 characters. Players can also write
-- their own profile row directly (policy own_profile), so the bound lives in the database too.
alter table profiles
  add constraint profiles_display_name_len
  check (display_name is null or char_length(display_name) between 2 and 24);
