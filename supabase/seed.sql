-- Données de démonstration (établissements fictifs, mêmes contenus que src/data/demo-offers.ts).
-- À exécuter dans l'éditeur SQL de Supabase après la migration 20261013000001_init.sql.

with b as (
  insert into public.businesses (name, kind, whatsapp, phone, rating, review_count) values
    ('Restaurant Le Grand Large', 'Restaurant partenaire', '261990000001', '+261 99 00 000 01', 4.6, 124),
    ('La Terrasse',               'Restaurant partenaire', '261990000002', '+261 99 00 000 02', 4.4, 87),
    ('Café de la Plage',          'Café-restaurant',       '261990000003', null,                 4.2, 52),
    ('Hôtel Baobab Beach',        'Hôtel partenaire',      '261990000004', '+261 99 00 000 04', 4.5, 211),
    ('Corniche Palm Hôtel',       'Hôtel partenaire',      '261990000005', '+261 99 00 000 05', 4.3, 96),
    ('Boina Excursions',          'Agence d''excursions',  '261990000006', '+261 99 00 000 06', 4.8, 63),
    ('Le Village Lounge',         'Bar & scène live',      '261990000007', null,                 4.1, 40)
  returning id, name
)
insert into public.offers
  (slug, business_id, title, description, category, image_url, price_original, price_offer,
   conditions, location, valid_until, is_verified, verified_at, is_featured, status)
select o.slug, b.id, o.title, o.description, o.category,
       'https://images.unsplash.com/photo-' || o.photo || '?w=1200&q=75&auto=format&fit=crop',
       o.price_original, o.price_offer, o.conditions, o.location,
       current_date + o.valid_in_days,
       o.verified_days_ago is not null,
       current_date - o.verified_days_ago,
       o.is_featured, 'published'
from (values
  ('menu-duo-bord-de-mer', 'Restaurant Le Grand Large', 'Menu duo au bord de mer',
   'Profitez d''un moment gourmand face à l''océan avec ce menu duo composé de poissons frais et de spécialités locales. Une expérience unique dans un cadre exceptionnel !',
   'manger', '1559339352-11d035aa65de', 50000, 42500,
   'Valable pour 2 personnes, sur place uniquement. Boissons non incluses.', 'Mahajanga, bord de mer', 7, 0, true),
  ('nuit-bungalow-vue-mer', 'Hôtel Baobab Beach', 'Nuit en bungalow vue mer',
   'Une nuit dans un bungalow face à la mer, petit-déjeuner inclus, avec accès libre à la piscine. Idéal pour une escapade en amoureux sans quitter Mahajanga.',
   'dormir', '1520250497591-112f2f40a3f4', 120000, 96000,
   'Pour 2 personnes, du dimanche au jeudi. Petit-déjeuner inclus.', 'Mahajanga, Amborovy', 7, 1, true),
  ('excursion-ile-aux-pigeons', 'Boina Excursions', 'Excursion île aux Pigeons',
   'Journée en bateau vers l''île aux Pigeons : baignade, snorkeling et déjeuner de fruits de mer grillés sur la plage. Départ le matin depuis le port.',
   'activites', '1570789210967-2cac24afeb00', 100000, 90000,
   'Par personne. Départ à 8 h, minimum 4 participants. Déjeuner inclus.', 'Départ du port de Mahajanga', 9, 2, true),
  ('diner-romantique', 'La Terrasse', 'Dîner romantique',
   'Entrée, plat et dessert pour deux, servis en terrasse à la lueur des bougies. Le chef propose une carte de saison mettant à l''honneur les produits de la région Boeny.',
   'manger', '1414235077428-338989a2e8c0', 80000, 60000,
   'Pour 2 personnes, le soir uniquement. Réservation conseillée la veille.', 'Mahajanga, centre-ville', 5, 0, true),
  ('plateau-fruits-de-mer', 'Restaurant Le Grand Large', 'Plateau fruits de mer à partager',
   'Crevettes, calamars, poisson du jour et crabe, accompagnés de riz coco et de sauces maison. Le plateau idéal pour un déjeuner entre amis.',
   'manger', '1615141982883-c7ad0e69fd62', 120000, 95000,
   'Pour 3 à 4 personnes. Selon arrivage du jour.', 'Mahajanga, bord de mer', 12, 3, false),
  ('brunch-du-dimanche', 'Café de la Plage', 'Brunch du dimanche à volonté',
   'Viennoiseries, fruits frais, mofo gasy, œufs à la demande et jus pressés. Tous les dimanches de 9 h à 13 h.',
   'manger', '1504674900247-0877df9cc836', 45000, 35000,
   'Par adulte. Gratuit pour les enfants de moins de 6 ans.', 'Mahajanga, La Corniche', 20, 4, false),
  ('cari-crevettes-midi', 'La Terrasse', 'Formule midi cari de crevettes',
   'Cari de crevettes au lait de coco, riz blanc et boisson fraîche. Servi rapidement, parfait pour la pause déjeuner.',
   'manger', '1559847844-5315695dadae', 25000, 18000,
   'Du lundi au vendredi, de 11 h 30 à 14 h.', 'Mahajanga, centre-ville', 3, null, false),
  ('sejour-detente-2-nuits', 'Corniche Palm Hôtel', 'Séjour détente 2 nuits',
   'Deux nuits en chambre supérieure, petits-déjeuners inclus et un dîner offert le premier soir. Accès piscine et transats face à la baie.',
   'dormir', '1566073771259-6a8506099945', 300000, 240000,
   'Pour 2 personnes. Hors jours fériés.', 'Mahajanga, La Corniche', 18, 1, false),
  ('day-use-piscine-dejeuner', 'Hôtel Baobab Beach', 'Day-use piscine + déjeuner',
   'Accès à la piscine de 10 h à 17 h, transat, serviette et déjeuner (plat + boisson).',
   'dormir', '1582719508461-905c673771fd', 60000, 45000,
   'Par personne, le week-end uniquement.', 'Mahajanga, Amborovy', 10, 2, false),
  ('bapteme-plongee', 'Boina Excursions', 'Baptême de plongée',
   'Première plongée encadrée par un moniteur diplômé, matériel fourni, dans les eaux claires au large de Mahajanga.',
   'activites', '1544551763-46a013bb70d5', 150000, 120000,
   'À partir de 12 ans. Certificat médical non requis.', 'Départ du port de Mahajanga', 15, 5, false),
  ('soiree-live-music', 'Le Village Lounge', 'Soirée live music',
   'Concert live chaque vendredi et samedi : salegy, afro et variétés. Entrée avec une boisson offerte.',
   'sorties', '1501281668745-f7f57925c3b4', 20000, 15000,
   'Entrée + 1 boisson. À partir de 21 h.', 'Mahajanga, Village touristique', 6, 0, true),
  ('happy-hour-cocktails', 'Le Village Lounge', 'Happy hour cocktails',
   '2 cocktails achetés, le 3e offert, à savourer devant le coucher de soleil sur le canal du Mozambique.',
   'sorties', '1470337458703-46ad1756a187', 15000, 10000,
   'Tous les jours de 17 h à 19 h.', 'Mahajanga, La Corniche', 25, 6, false)
) as o(slug, business, title, description, category, photo, price_original, price_offer,
       conditions, location, valid_in_days, verified_days_ago, is_featured)
join b on b.name = o.business;
