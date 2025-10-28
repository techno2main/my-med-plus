INSERT INTO "public"."pathologies" ("id", "name", "description", "created_at", "updated_at", "is_approved", "created_by") 
VALUES 
('51051513-8f8d-4999-9465-f2d1a3e6f2e9', 'Douleur/Fièvre', 'Symptômes ponctuels', '2025-10-13 15:20:54.928678+00', '2025-10-13 15:36:01.227607+00', 'false', null),
('a8560fee-3b94-4701-8752-8a6a292b9ab7', 'Insomnie', 'Troubles du sommeil', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:09.955915+00', 'false', null),
('dc47c6b3-2245-486d-ad45-c014e8d15b27', 'Diabète T2', 'Hyperglycémie chronique', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:12:55.18003+00', 'false', null),
('dcb3503e-ac56-42e7-ade1-d75c05926f96', 'Cholestérol', 'Hypercholestérolémie', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:36.568136+00', 'false', null),
('e9079dce-7d53-41e1-af5c-1fffd9c7c238', 'Anxiété', 'Troubles anxieux', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:16.109111+00', 'false', null);

INSERT INTO "public"."allergies" ("id", "name", "severity", "description", "created_at", "updated_at", "user_id") 
VALUES 
('03217b5f-1b70-465c-88d4-1f0db218af39', 'Bactrim', 'Modérée', 'Association sulfaméthoxazole-triméthoprime', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:03.203737+00', null),
('671c4659-ba88-4942-b394-380cc4a0b46f', 'Totapem', 'Sévère', 'Antibiotique céphalosporine', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:07.088007+00', null),
('a58a2327-6232-4426-81bd-c62689380030', 'Amoxicilline', 'Sévère', 'Antibiotique de la famille des pénicillines', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:34:57.236817+00', null);

INSERT INTO "public"."medication_catalog" ("id", "name", "pathology", "default_posology", "description", "created_at", "updated_at", "form", "color", "strength", "initial_stock", "min_threshold", "default_times", "is_approved", "created_by") 
VALUES 
('20cdc76f-4e18-403c-b05a-71ebd662c620', 'Xigduo', 'Diabète T2', '1 comprimé matin et soir', 'Diabète Type 2', '2025-10-13 12:41:41.333622+00', '2025-10-20 18:32:40.553536+00', null, null, '5mg/1000mg', '0', '10', '{"09:30","20:00"}', 'false', null),
('61a5e9aa-7a8a-4258-9d07-6fc8dde6e42e', 'Doliprane', 'Douleur/Fièvre', '1 comprimé matin, midi et soir', null, '2025-10-26 11:08:34.629837+00', '2025-10-26 11:08:34.629837+00', null, null, '1mg', '0', '10', '{"09:30","12:30","19:30"}', 'false', null),
('6a21de1a-3381-4923-b4c2-194ac8008ae8', 'Quviviq', 'Insomnie', '1 comprimé au coucher', 'Troubles du Sommeil', '2025-10-13 16:41:06.990099+00', '2025-10-19 19:36:43.669411+00', null, null, '50mg', '0', '10', '{"22:00"}', 'false', null),
('c5be88b2-d692-4a1d-8a7c-134a043ab0cd', 'Venlafaxine', 'Anxiété', '1 comprimé au coucher', 'Anxiété chronique', '2025-10-13 16:41:43.414395+00', '2025-10-20 18:30:45.731075+00', null, null, '225mg', '0', '10', '{"22:00"}', 'false', null),
('e145c2c2-2c49-4521-9dc0-89b9f2f3c54a', 'Simvastatine', 'Cholestérol', '1 comprimé le soir', 'Cholestérol', '2025-10-13 12:41:41.333622+00', '2025-10-20 18:32:54.811993+00', null, null, '10mg', '0', '7', '{"20:00"}', 'false', null);
