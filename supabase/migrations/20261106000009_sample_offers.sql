-- Janga Explorer : offres d'exemple, pour présenter le site rempli avant son lancement public.
-- À exécuter après 20261106000008_offer_tickets.sql.
--
-- 48 offres et 23 établissements fictifs (numéros en 26199…, préfixe attribué à aucun opérateur), repris de
-- src/data/demo-offers.ts. Leurs établissements portent is_sample = true : le site affiche une étiquette « Exemple »,
-- l'administration les regroupe à part, et le superadmin les supprime tous d'un coup (delete_sample_content) le jour
-- du lancement. Les dates sont relatives au jour où la migration est appliquée ; extend_sample_offers les prolonge.

alter table public.businesses add column is_sample boolean not null default false;

-- Un pro ne crée jamais d'établissement d'exemple et ne peut pas marquer le sien comme tel.
drop policy "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own" on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and rating is null and review_count = 0 and not is_sample);

create or replace function public.businesses_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    new.owner_id := old.owner_id;
    new.rating := old.rating;
    new.review_count := old.review_count;
    new.is_sample := old.is_sample;
  end if;
  return new;
end;
$$;

-- Restes de l'ancien jeu de démonstration (supabase/seed.sql) : établissements sans propriétaire aux numéros fictifs.
-- On les retire avec leurs offres pour repartir du jeu complet.
delete from public.businesses where owner_id is null and whatsapp like '26199%';

create temporary table sample_businesses (
  key text, name text, kind text, whatsapp text, phone text, rating numeric, review_count integer
);
insert into sample_businesses values
    ('b-grand-large', 'Restaurant Le Grand Large', 'Restaurant partenaire', '261990000001', '+261 99 00 000 01', 4.6, 124),
    ('b-baobab-beach', 'Hôtel Baobab Beach', 'Hôtel partenaire', '261990000004', '+261 99 00 000 04', 4.5, 211),
    ('b-boina-excursions', 'Boina Excursions', 'Agence d''excursions', '261990000006', '+261 99 00 000 06', 4.8, 63),
    ('b-la-terrasse', 'La Terrasse', 'Restaurant partenaire', '261990000002', '+261 99 00 000 02', 4.4, 87),
    ('b-cafe-plage', 'Café de la Plage', 'Café-restaurant', '261990000003', null, 4.2, 52),
    ('b-corniche-palm', 'Corniche Palm Hôtel', 'Hôtel partenaire', '261990000005', '+261 99 00 000 05', 4.3, 96),
    ('b-village-lounge', 'Le Village Lounge', 'Bar & scène live', '261990000007', null, 4.1, 40),
    ('b-four-du-port', 'Pizzeria Le Four du Port', 'Pizzeria', '261990000008', '+261 99 00 000 08', 4.5, 158),
    ('b-comptoir-boina', 'Le Comptoir du Boina', 'Bar-restaurant', '261990000009', null, 4.2, 74),
    ('b-kafe-mora', 'Kafe Mora', 'Café-pâtisserie', '261990000010', null, 4.7, 96),
    ('b-glacier-vanille', 'Glacier Vanille & Coco', 'Glacier', '261990000011', null, 4.6, 61),
    ('b-chez-ramaro', 'Chez Ramaro, grillades', 'Grill', '261990000012', '+261 99 00 000 12', 4.4, 203),
    ('b-cabane-pecheurs', 'La Cabane des Pêcheurs', 'Restaurant de poisson', '261990000013', '+261 99 00 000 13', 4.5, 118),
    ('b-pointe-amborovy', 'Bungalows de la Pointe', 'Bungalows en bord de plage', '261990000014', '+261 99 00 000 14', 4.6, 89),
    ('b-kintana-lodge', 'Kintana Lodge', 'Hôtel', '261990000015', '+261 99 00 000 15', 4.3, 57),
    ('b-hotel-fanjava', 'Hôtel Fanjava', 'Hôtel avec piscine', '261990000016', '+261 99 00 000 16', 4.4, 132),
    ('b-spa-ylang', 'Spa Ylang', 'Spa et massages', '261990000017', null, 4.8, 45),
    ('b-boina-bleu', 'Club nautique Boina Bleu', 'Plongée et sports nautiques', '261990000018', '+261 99 00 000 18', 4.7, 72),
    ('b-fanilo', 'Studio Fanilo', 'Yoga et bien-être', '261990000020', null, 4.9, 28),
    ('b-ateliers-boeny', 'Atelier Saveurs du Boeny', 'Cours de cuisine', '261990000021', null, 4.8, 39),
    ('b-rova-aventure', 'Rova Aventure', 'Camping et randonnée', '261990000019', null, 4.5, 33),
    ('b-fit-boina', 'Fit Boina', 'Salle de sport', '261990000022', '+261 99 00 000 22', 4.1, 51),
    ('b-corniche-events', 'Espace Corniche Événements', 'Organisateur d''événements', '261990000023', '+261 99 00 000 23', 4.3, 66);

insert into public.businesses (name, kind, whatsapp, phone, rating, review_count, is_sample)
select name, kind, whatsapp, phone, rating, review_count, true from sample_businesses;

create temporary table sample_offers (
  slug text, business_name text, title text, description text, category text, image_url text,
  price_original integer, price_offer integer, ticket_tiers jsonb, presale_until date, conditions text,
  location text, valid_until date, is_verified boolean, verified_at date, is_featured boolean, published_days_ago integer
);
insert into sample_offers values
    ('menu-duo-bord-de-mer', 'Restaurant Le Grand Large', 'Menu duo au bord de mer', 'Menu pour deux en terrasse face à la mer : poisson grillé du jour ou cari de crevettes, riz coco, dessert et une boisson chacun.', 'manger', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=75&auto=format&fit=crop', 50000, 42500, null, null, 'Valable pour 2 personnes, sur place uniquement. Boissons non incluses.', 'Mahajanga, bord de mer', current_date + 7, true, current_date, true, 10),
    ('nuit-bungalow-vue-mer', 'Hôtel Baobab Beach', 'Nuit en bungalow vue mer', 'Une nuit pour deux dans un bungalow face à la mer, petit-déjeuner inclus, avec accès libre à la piscine.', 'dormir', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=75&auto=format&fit=crop', 120000, 96000, null, null, 'Pour 2 personnes, du dimanche au jeudi. Petit-déjeuner inclus.', 'Mahajanga, Amborovy', current_date + 7, true, current_date - 1, true, 10),
    ('excursion-ile-aux-pigeons', 'Boina Excursions', 'Excursion île aux Pigeons', 'Journée en bateau vers l''île aux Pigeons : baignade, snorkeling et déjeuner de fruits de mer grillés sur la plage. Départ le matin depuis le port.', 'activites', 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1200&q=75&auto=format&fit=crop', 100000, 90000, null, null, 'Par personne. Départ à 8 h, minimum 4 participants. Déjeuner inclus.', 'Départ du port de Mahajanga', current_date + 9, true, current_date - 2, true, 10),
    ('diner-romantique', 'La Terrasse', 'Dîner romantique', 'Entrée, plat et dessert pour deux, servis en terrasse aux bougies. La carte change avec la saison et utilise des produits de la région Boeny.', 'manger', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=75&auto=format&fit=crop', 80000, 60000, null, null, 'Pour 2 personnes, le soir uniquement. Réservation conseillée la veille.', 'Mahajanga, centre-ville', current_date + 5, true, current_date, true, 10),
    ('plateau-fruits-de-mer', 'Restaurant Le Grand Large', 'Plateau fruits de mer à partager', 'Crevettes, calamars, poisson du jour et crabe, avec riz coco et sauces maison.', 'manger', 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=1200&q=75&auto=format&fit=crop', 120000, 95000, null, null, 'Pour 3 à 4 personnes. Selon arrivage du jour.', 'Mahajanga, bord de mer', current_date + 12, true, current_date - 3, false, 10),
    ('brunch-du-dimanche', 'Café de la Plage', 'Brunch du dimanche à volonté', 'Viennoiseries, fruits frais, mofo gasy, œufs à la demande et jus pressés. Tous les dimanches de 9 h à 13 h.', 'manger', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=75&auto=format&fit=crop', 45000, 35000, null, null, 'Par adulte. Gratuit pour les enfants de moins de 6 ans.', 'Mahajanga, La Corniche', current_date + 20, true, current_date - 4, false, 10),
    ('cari-crevettes-midi', 'La Terrasse', 'Formule midi cari de crevettes', 'Cari de crevettes au lait de coco, riz blanc et boisson fraîche. Servi rapidement, parfait pour la pause déjeuner.', 'manger', 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=75&auto=format&fit=crop', 25000, 18000, null, null, 'Du lundi au vendredi, de 11 h 30 à 14 h.', 'Mahajanga, centre-ville', current_date + 3, false, null, false, 10),
    ('sejour-detente-2-nuits', 'Corniche Palm Hôtel', 'Séjour détente 2 nuits', 'Deux nuits en chambre supérieure, petits-déjeuners inclus et un dîner offert le premier soir. Accès piscine et transats face à la baie.', 'dormir', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=75&auto=format&fit=crop', 300000, 240000, null, null, 'Pour 2 personnes. Hors jours fériés.', 'Mahajanga, La Corniche', current_date + 18, true, current_date - 1, false, 10),
    ('day-use-piscine-dejeuner', 'Hôtel Baobab Beach', 'Day-use piscine + déjeuner', 'Accès à la piscine de 10 h à 17 h, transat, serviette et déjeuner (plat + boisson).', 'dormir', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=75&auto=format&fit=crop', 60000, 45000, null, null, 'Par personne, le week-end uniquement.', 'Mahajanga, Amborovy', current_date + 10, true, current_date - 2, false, 10),
    ('bapteme-plongee', 'Boina Excursions', 'Baptême de plongée', 'Première plongée encadrée par un moniteur diplômé, matériel fourni, dans les eaux claires au large de Mahajanga.', 'activites', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=75&auto=format&fit=crop', 150000, 120000, null, null, 'À partir de 12 ans. Certificat médical non requis.', 'Départ du port de Mahajanga', current_date + 15, true, current_date - 5, false, 10),
    ('soiree-live-music', 'Le Village Lounge', 'Soirée live music', 'Concert live chaque vendredi et samedi : salegy, afro et variétés. Entrée avec une boisson offerte.', 'sorties', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=75&auto=format&fit=crop', 20000, 15000, '[{"label":"Entrée + 1 boisson","presale":15000,"door":20000},{"label":"VIP (carré + bouteille)","presale":60000,"door":80000},{"label":"Entrée étudiant","presale":null,"door":10000}]'::jsonb, current_date + 4, 'Entrée + 1 boisson. À partir de 21 h.', 'Mahajanga, Village touristique', current_date + 6, true, current_date, true, 10),
    ('happy-hour-cocktails', 'Le Village Lounge', 'Happy hour cocktails', '2 cocktails achetés, le 3e offert, à savourer devant le coucher de soleil sur le canal du Mozambique.', 'sorties', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=75&auto=format&fit=crop', 15000, 10000, null, null, 'Tous les jours de 17 h à 19 h.', 'Mahajanga, La Corniche', current_date + 25, true, current_date - 6, false, 10),
    ('deuxieme-pizza-moitie-prix', 'Pizzeria Le Four du Port', '2e pizza à moitié prix', 'Pour deux pizzas achetées, la moins chère est à moitié prix. Pâte maison cuite au feu de bois, 12 recettes au choix, dont la pizza aux crevettes.', 'manger', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&q=75&auto=format&fit=crop', 64000, 48000, null, null, 'Prix pour 2 pizzas moyennes. Sur place ou à emporter, du lundi au jeudi.', 'Mahajanga, quartier du Port', current_date + 20, true, current_date - 2, true, 10),
    ('menu-burger-frites-boisson', 'Le Comptoir du Boina', 'Menu burger, frites et boisson', 'Burger au bœuf haché (150 g), cheddar et oignons caramélisés, avec frites maison et une boisson fraîche au choix.', 'manger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=75&auto=format&fit=crop', 26000, 20000, null, null, 'Le midi uniquement, de 11 h 30 à 14 h 30.', 'Mahajanga, Mahabibo', current_date + 14, true, current_date - 5, false, 1),
    ('petit-dejeuner-complet', 'Kafe Mora', 'Petit-déjeuner complet', 'Café ou thé, jus de fruits pressé, deux œufs au plat sur pain grillé et une viennoiserie. Servi en terrasse dès 6 h 30.', 'manger', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=75&auto=format&fit=crop', 15000, 12000, null, null, 'Jusqu''à 10 h 30, tous les jours sauf le lundi.', 'Mahajanga, La Corniche', current_date + 30, true, current_date - 3, false, 10),
    ('trois-boules-pour-deux', 'Glacier Vanille & Coco', '3 boules de glace pour le prix de 2', 'Glaces faites sur place : vanille de la Sava, coco, mangue, chocolat et sorbet citron vert. En cornet ou en pot.', 'manger', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1200&q=75&auto=format&fit=crop', 9000, 6000, null, null, 'De 15 h à la fermeture.', 'Mahajanga, La Corniche', current_date + 2, true, current_date - 1, false, 10),
    ('brochettes-zebu-riz', 'Chez Ramaro, grillades', '10 brochettes de zébu avec riz', 'Dix brochettes de zébu marinées, grillées au charbon de bois, servies avec du riz blanc, des achards et du rougail tomate.', 'manger', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=75&auto=format&fit=crop', 24000, 18000, null, null, 'Le soir à partir de 18 h. À partager à deux.', 'Mahajanga, Tsaramandroso', current_date + 1, true, current_date, true, 10),
    ('poisson-du-jour-grille', 'La Cabane des Pêcheurs', 'Poisson du jour grillé', 'Le poisson pêché le matin même (capitaine, mérou ou thon selon l''arrivage), grillé, avec riz coco ou frites et une salade.', 'manger', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=75&auto=format&fit=crop', 32000, 25000, null, null, 'Dans la limite de la pêche du jour. Demandez le poisson disponible sur WhatsApp.', 'Mahajanga, plage du Village touristique', current_date + 18, true, current_date - 4, true, 10),
    ('pates-fruits-de-mer', 'La Terrasse', 'Pâtes aux fruits de mer', 'Spaghettis aux crevettes, calamars et moules, sauce tomate légèrement pimentée.', 'manger', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=1200&q=75&auto=format&fit=crop', 35000, 28000, null, null, 'Midi et soir, du mardi au dimanche.', 'Mahajanga, La Corniche', current_date + 10, true, current_date - 8, false, 10),
    ('bowl-sante-jus', 'Kafe Mora', 'Bowl du jour et jus frais', 'Bowl de légumes de saison, avocat, pois chiches et œuf mollet, avec un jus de fruits pressé au choix.', 'manger', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=75&auto=format&fit=crop', 22000, 18000, null, null, 'Le midi, du lundi au samedi.', 'Mahajanga, La Corniche', current_date + 12, false, null, false, 0),
    ('diner-deux-menu-trois-plats', 'Restaurant Le Grand Large', 'Dîner à deux, menu 3 plats', 'Entrée, plat et dessert pour deux personnes, avec une bouteille de vin rouge ou rosé. Le menu change chaque semaine.', 'manger', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=75&auto=format&fit=crop', 150000, 120000, null, null, 'Le vendredi et le samedi soir, sur réservation.', 'Mahajanga, bord de mer', current_date + 9, true, current_date - 2, false, 10),
    ('deux-cafes-deux-viennoiseries', 'Kafe Mora', '2 cafés et 2 viennoiseries', 'Deux cafés (expresso, cappuccino ou café au lait) et deux viennoiseries du jour : croissant, pain au chocolat ou mofo gasy.', 'manger', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=75&auto=format&fit=crop', 14000, 10000, null, null, 'Tous les jours jusqu''à 11 h.', 'Mahajanga, La Corniche', current_date + 3, true, current_date - 3, false, 10),
    ('verrines-fraise-coco', 'Glacier Vanille & Coco', 'Verrines fraise et coco', 'Trois verrines de panna cotta coco aux fraises, à emporter ou à manger sur place.', 'manger', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=75&auto=format&fit=crop', 15000, 10500, null, null, 'Le week-end, dans la limite des verrines préparées le matin.', 'Mahajanga, La Corniche', current_date + 5, true, current_date - 1, false, 2),
    ('bungalow-pieds-dans-eau-deux-nuits', 'Bungalows de la Pointe', '2 nuits en bungalow sur la plage', 'Bungalow pour deux personnes à 20 mètres de la mer, avec terrasse, ventilateur et moustiquaire. Petit-déjeuner compris les deux matins.', 'dormir', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=75&auto=format&fit=crop', 360000, 280000, null, null, 'Arrivée du dimanche au jeudi. Transfert depuis Mahajanga en supplément (30 000 Ar).', 'Amborovy', current_date + 35, true, current_date - 6, true, 10),
    ('nuit-petit-dejeuner-kintana', 'Kintana Lodge', 'Nuit et petit-déjeuner pour 2', 'Chambre double climatisée avec salle de bain privée et petit-déjeuner pour deux. Parking gardé.', 'dormir', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=75&auto=format&fit=crop', 180000, 140000, null, null, 'Valable une nuit, selon disponibilité. Arrivée à partir de 14 h.', 'Mahajanga, Tsaramandroso', current_date + 22, false, null, false, 1),
    ('journee-piscine-dejeuner', 'Hôtel Fanjava', 'Journée piscine et déjeuner', 'Accès à la piscine et aux transats de 9 h à 17 h, serviette fournie, avec un déjeuner (plat et boisson) au restaurant de l''hôtel.', 'dormir', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=75&auto=format&fit=crop', 60000, 45000, null, null, 'Prix par adulte. Enfants de moins de 12 ans : 25 000 Ar. Sur réservation la veille.', 'Mahajanga, La Corniche', current_date + 28, true, current_date - 4, true, 10),
    ('sejour-famille-enfants-gratuits', 'Hôtel Baobab Beach', '3 nuits en famille, enfants gratuits', 'Chambre familiale pour 2 adultes et 2 enfants, petits-déjeuners compris. Les enfants de moins de 12 ans ne paient pas.', 'dormir', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=75&auto=format&fit=crop', 600000, 450000, null, null, 'Pendant les vacances scolaires. Lit bébé sur demande.', 'Mahajanga, Amborovy', current_date + 40, true, current_date - 7, false, 10),
    ('chambre-double-semaine', 'Corniche Palm Hôtel', 'Chambre double en semaine', 'Chambre double vue jardin, climatisée, avec télévision et wifi. Accès libre à la piscine de l''hôtel.', 'dormir', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=75&auto=format&fit=crop', 160000, 120000, null, null, 'Nuits du lundi au jeudi. Petit-déjeuner en option : 15 000 Ar par personne.', 'Mahajanga, La Corniche', current_date + 16, true, current_date - 9, false, 10),
    ('week-end-deux-nuits-fanjava', 'Hôtel Fanjava', 'Week-end 2 nuits avec dîner', 'Deux nuits en chambre double, deux petits-déjeuners et un dîner pour deux le samedi soir au bord de la piscine.', 'dormir', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=75&auto=format&fit=crop', 420000, 330000, null, null, 'Arrivée le vendredi, départ le dimanche à midi.', 'Mahajanga, La Corniche', current_date + 24, true, current_date - 4, false, 10),
    ('massage-une-heure', 'Spa Ylang', 'Massage relaxant d''une heure', 'Massage du corps à l''huile de coco et de ylang-ylang, en cabine individuelle.', 'activites', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=75&auto=format&fit=crop', 80000, 60000, null, null, 'Sur rendez-vous, du mardi au samedi.', 'Mahajanga, La Corniche', current_date + 21, true, current_date - 2, false, 10),
    ('massage-pierres-chaudes-duo', 'Spa Ylang', 'Massage aux pierres chaudes en duo', 'Une heure et demie de massage aux pierres chaudes pour deux personnes dans la même cabine, avec un thé à la citronnelle.', 'activites', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=75&auto=format&fit=crop', 180000, 140000, null, null, 'Sur rendez-vous, au moins 24 h à l''avance.', 'Mahajanga, La Corniche', current_date + 2, true, current_date - 1, false, 10),
    ('plongee-decouverte-bateau', 'Club nautique Boina Bleu', 'Plongée découverte en bateau', 'Première plongée avec un moniteur, jusqu''à 6 mètres de profondeur. Équipement complet, briefing et sortie en bateau compris.', 'activites', 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=1200&q=75&auto=format&fit=crop', 190000, 150000, null, null, 'À partir de 10 ans. Départ à 8 h, retour vers 11 h 30. Annulé si la mer est trop agitée.', 'Mahajanga, port de plaisance', current_date + 26, true, current_date - 3, true, 10),
    ('4x4-cirque-rouge-coucher-soleil', 'Boina Excursions', 'Cirque Rouge en 4x4 au coucher du soleil', 'Départ en 4x4 à 15 h 30, une heure de marche dans les canyons du Cirque Rouge avec un guide, puis le coucher du soleil sur la falaise. Retour en ville vers 19 h.', 'activites', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=75&auto=format&fit=crop', 90000, 70000, null, null, 'Prix par personne, 3 personnes minimum. Prise en charge à votre hôtel.', 'Cirque Rouge, à 12 km de Mahajanga', current_date + 30, true, current_date - 2, true, 10),
    ('snorkeling-pique-nique-katsepy', 'Club nautique Boina Bleu', 'Snorkeling et pique-nique à Katsepy', 'Traversée en bateau vers Katsepy, deux heures de snorkeling avec palmes, masque et tuba fournis, puis poisson grillé sur la plage.', 'activites', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=1200&q=75&auto=format&fit=crop', 120000, 90000, null, null, 'Départ à 8 h du port, retour vers 15 h. 4 personnes minimum.', 'Katsepy', current_date + 19, true, current_date - 5, false, 0),
    ('paddle-une-heure', 'Club nautique Boina Bleu', '1 heure de paddle', 'Location de paddle avec gilet, et cinq minutes d''explications pour les débutants. Adapté aux enfants à partir de 8 ans.', 'activites', 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=1200&q=75&auto=format&fit=crop', 30000, 20000, null, null, 'Le matin, quand la mer est calme.', 'Mahajanga, plage du Village touristique', current_date + 15, false, null, false, 10),
    ('yoga-lever-du-soleil', 'Studio Fanilo', 'Yoga au lever du soleil, 4 séances', 'Quatre séances d''une heure sur la plage, à 6 h, tous niveaux. Tapis prêtés sur place.', 'activites', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=75&auto=format&fit=crop', 60000, 40000, null, null, 'Le mardi et le jeudi. Les 4 séances sont à utiliser dans le mois.', 'Mahajanga, La Corniche', current_date + 27, true, current_date - 6, false, 10),
    ('cours-cuisine-malgache', 'Atelier Saveurs du Boeny', 'Cours de cuisine malgache', 'Trois heures pour préparer un romazava, un poulet au coco et des mofo gasy avec une cuisinière du quartier, puis le repas ensemble.', 'activites', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=75&auto=format&fit=crop', 65000, 50000, null, null, 'Le samedi à 9 h. 8 personnes au plus. Courses au marché comprises.', 'Mahajanga, Mahabibo', current_date + 13, true, current_date - 4, false, 1),
    ('nuit-camping-antsanitia', 'Rova Aventure', 'Nuit en camping à Antsanitia', 'Tente montée pour deux, dîner au feu de bois et petit-déjeuner, à quelques pas de la plage. Transport aller-retour depuis Mahajanga compris.', 'activites', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=75&auto=format&fit=crop', 120000, 95000, null, null, 'Prix par personne. Départ le samedi à 15 h, retour le dimanche à 11 h.', 'Antsanitia', current_date + 33, true, current_date - 8, false, 10),
    ('balade-coucher-soleil', 'Boina Excursions', 'Balade au coucher du soleil', 'Deux heures de marche avec un guide dans la savane autour de la ville, jusqu''au point de vue pour le coucher du soleil. Boisson fraîche à l''arrivée.', 'activites', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=75&auto=format&fit=crop', 40000, 30000, null, null, 'Départ à 16 h. Chaussures fermées conseillées.', 'Environs de Mahajanga', current_date + 11, true, current_date - 5, false, 10),
    ('abonnement-salle-sport-mois', 'Fit Boina', '1 mois de salle de sport', 'Accès illimité à la salle de musculation et de cardio, et aux cours collectifs du soir (zumba, renforcement).', 'activites', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=75&auto=format&fit=crop', 100000, 70000, null, null, 'Pour un premier abonnement. Ouvert de 6 h à 21 h.', 'Mahajanga, Mahabibo', current_date + 20, false, null, false, 10),
    ('concert-salegy-corniche', 'Espace Corniche Événements', 'Concert de salegy sur la Corniche', 'Trois groupes de salegy de Mahajanga sur la même scène, de 20 h à 1 h. Buvette et grillades sur place.', 'sorties', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=75&auto=format&fit=crop', 20000, 15000, '[{"label":"Billet normal","presale":15000,"door":20000},{"label":"VIP (espace assis + 1 boisson)","presale":50000,"door":70000}]'::jsonb, current_date + 3, 'Billets en prévente au guichet de l''Espace Corniche ou par Mobile Money. Gratuit pour les moins de 10 ans.', 'Mahajanga, La Corniche', current_date + 5, true, current_date - 1, true, 2),
    ('soiree-dj-plage', 'Espace Corniche Événements', 'Soirée DJ sur la plage', 'Deux DJ de 21 h à 3 h, piste en plein air sur le sable. Bar à cocktails et snacks.', 'sorties', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=75&auto=format&fit=crop', 15000, 10000, '[{"label":"Entrée","presale":10000,"door":15000},{"label":"Table 4 personnes + 1 bouteille","presale":120000,"door":150000}]'::jsonb, current_date + 6, 'Interdit aux moins de 18 ans.', 'Mahajanga, plage du Village touristique', current_date + 8, true, current_date - 2, false, 10),
    ('festival-musique-deux-jours', 'Espace Corniche Événements', 'Festival de musique, 2 jours', 'Deux jours de concerts en plein air : salegy, afro, reggae et rap malgache, avec une quinzaine d''artistes. Village de stands et restauration.', 'sorties', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=75&auto=format&fit=crop', 25000, 20000, '[{"label":"Pass 1 jour","presale":20000,"door":25000},{"label":"Pass 2 jours","presale":35000,"door":45000},{"label":"Enfant (moins de 12 ans)","presale":null,"door":5000}]'::jsonb, current_date + 9, 'Programme complet envoyé sur WhatsApp. Ouverture des portes à 14 h.', 'Mahajanga, stade municipal', current_date + 12, true, current_date - 3, true, 10),
    ('soiree-karaoke-mardi', 'Le Comptoir du Boina', 'Soirée karaoké du mardi', 'Karaoké de 20 h à minuit, chansons malgaches, françaises et anglaises. Deux boissons achetées, la troisième offerte.', 'sorties', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=75&auto=format&fit=crop', 18000, 12000, null, null, 'Le mardi soir uniquement. Prix pour 3 boissons.', 'Mahajanga, Mahabibo', current_date + 17, true, current_date - 6, false, 10),
    ('afterwork-planche-cocktails', 'Le Village Lounge', 'Afterwork : planche et 2 cocktails', 'Une planche à partager (samoussas, brochettes, accras) et deux cocktails au choix parmi cinq, de 17 h à 20 h.', 'sorties', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=75&auto=format&fit=crop', 45000, 35000, null, null, 'Du lundi au vendredi.', 'Mahajanga, Village touristique', current_date + 3, true, current_date - 2, false, 10),
    ('diner-concert-jazz', 'Restaurant Le Grand Large', 'Dîner-concert jazz acoustique', 'Un trio jazz joue de 20 h à 23 h. Le billet dîner comprend un menu 3 plats ; le billet concert donne accès au bar.', 'sorties', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=75&auto=format&fit=crop', 75000, 60000, '[{"label":"Dîner-concert","presale":60000,"door":75000},{"label":"Concert seul","presale":null,"door":20000}]'::jsonb, current_date + 4, 'Réservation conseillée pour le dîner, 40 places.', 'Mahajanga, bord de mer', current_date + 6, true, current_date - 1, false, 0),
    ('repas-dansant-samedi', 'Hôtel Fanjava', 'Repas dansant du samedi', 'Buffet malgache et européen à volonté, puis orchestre et piste de danse jusqu''à 2 h.', 'sorties', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=75&auto=format&fit=crop', 70000, 55000, '[{"label":"Repas + soirée","presale":55000,"door":70000},{"label":"Soirée seule (à partir de 22 h)","presale":15000,"door":20000}]'::jsonb, current_date + 2, 'Tenue correcte demandée.', 'Mahajanga, La Corniche', current_date + 4, true, current_date - 2, false, 10),
    ('soiree-hip-hop-village-lounge', 'Le Village Lounge', 'Soirée hip-hop malgache', 'Quatre rappeurs de Mahajanga et un DJ, de 21 h à 2 h. Open mic de 21 h à 22 h pour les jeunes artistes.', 'sorties', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=75&auto=format&fit=crop', 15000, 10000, '[{"label":"Entrée","presale":10000,"door":15000},{"label":"Entrée + t-shirt de la soirée","presale":30000,"door":null}]'::jsonb, current_date + 5, 'Les t-shirts sont à retirer à l''entrée, dans la limite du stock.', 'Mahajanga, Village touristique', current_date + 7, true, current_date - 3, false, 1);

insert into public.offers
  (slug, business_id, title, description, category, image_url, price_original, price_offer, ticket_tiers, presale_until,
   conditions, location, valid_until, is_verified, verified_at, is_featured, status)
select o.slug, b.id, o.title, o.description, o.category, o.image_url, o.price_original, o.price_offer, o.ticket_tiers,
       o.presale_until, o.conditions, o.location, o.valid_until, o.is_verified, o.verified_at, o.is_featured, 'published'
from sample_offers o
join public.businesses b on b.name = o.business_name and b.is_sample;

-- La mise en ligne fixe published_at à maintenant : on le recule pour que seules quelques offres soient « nouvelles ».
update public.offers o
set published_at = now() - make_interval(days => s.published_days_ago)
from sample_offers s
where o.slug = s.slug;

drop table sample_offers;
drop table sample_businesses;

-- ---------------------------------------------------------------------------
-- Administration des exemples
-- ---------------------------------------------------------------------------

-- Repousse de extra_days la fin (et la prévente) de toutes les offres d'exemple. Ouvert à tous les administrateurs.
create function public.extend_sample_offers(extra_days integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  changed integer;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux administrateurs' using errcode = '42501';
  end if;
  if extra_days is null or extra_days not between 1 and 365 then
    raise exception 'Durée invalide' using errcode = '22023';
  end if;

  update public.offers
  set valid_until = valid_until + extra_days,
      presale_until = presale_until + extra_days,
      updated_at = now()
  where business_id in (select id from public.businesses where is_sample);
  get diagnostics changed = row_count;
  return changed;
end;
$$;

-- Supprime tous les établissements d'exemple et leurs offres (statistiques comprises). Réservé au superadmin.
create function public.delete_sample_content() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  removed integer;
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = '42501';
  end if;

  select count(*) into removed
  from public.offers where business_id in (select id from public.businesses where is_sample);
  delete from public.businesses where is_sample;
  return removed;
end;
$$;

revoke execute on function public.extend_sample_offers(integer) from public, anon;
revoke execute on function public.delete_sample_content() from public, anon;
grant execute on function public.extend_sample_offers(integer) to authenticated;
grant execute on function public.delete_sample_content() to authenticated;
