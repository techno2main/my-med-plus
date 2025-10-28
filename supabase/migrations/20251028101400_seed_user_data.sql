INSERT INTO "public"."profiles" ("id", "full_name", "date_of_birth", "created_at", "updated_at", "first_name", "last_name", "phone", "blood_type", "height", "weight", "avatar_url") 
VALUES ('40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', null, '1970-12-12', '2025-10-13 13:07:34.677164+00', '2025-10-18 12:05:18.527115+00', 'Tyson', 'Jackson', '0666101212', 'A+', '177', '78.10', 'https://rozkooglygxyaaedvebn.supabase.co/storage/v1/object/public/avatars/40f221e1-3fcb-4b03-b9b2-5bf8142a37cb/avatar.jpg');

INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") 
VALUES ('3d9a32f2-6c68-4ebb-9cb7-af7c0e6b2112', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'admin', '2025-10-13 22:01:20.408837+00');

INSERT INTO "public"."user_preferences" ("id", "user_id", "biometric_enabled", "two_factor_enabled", "created_at", "updated_at") 
VALUES ('239fb453-1f32-4db9-83e8-979e950d5c96', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'true', 'false', '2025-10-15 21:56:39.334379+00', '2025-10-25 12:14:12.736786+00');
