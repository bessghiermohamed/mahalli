-- ============================================================================
-- Mahalli — Seed data
-- 58 Algerian wilayas + one demo seller/store with six realistic products
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 58 wilayas (code, name_ar, name_fr, default_delivery_fee DZD)
-- ----------------------------------------------------------------------------
insert into public.wilayas (id, code, name_ar, name_fr, default_delivery_fee) values
  (1,  1, 'أدرار',            'Adrar',             1000),
  (2,  2, 'الشلف',            'Chlef',             600),
  (3,  3, 'الأغواط',          'Laghouat',          700),
  (4,  4, 'أم البواقي',       'Oum El Bouaghi',    600),
  (5,  5, 'باتنة',            'Batna',             600),
  (6,  6, 'بجاية',            'Béjaïa',            550),
  (7,  7, 'بسكرة',            'Biskra',            650),
  (8,  8, 'بشار',             'Béchar',            1000),
  (9,  9, 'البليدة',          'Blida',             450),
  (10, 10, 'البويرة',          'Bouira',            550),
  (11, 11, 'تمنراست',          'Tamanrasset',       1200),
  (12, 12, 'تبسة',             'Tébessa',           650),
  (13, 13, 'تلمسان',           'Tlemcen',           600),
  (14, 14, 'تيارت',            'Tiaret',            600),
  (15, 15, 'تيزي وزو',         'Tizi Ouzou',        550),
  (16, 16, 'الجزائر',          'Alger',             400),
  (17, 17, 'الجلفة',           'Djelfa',            700),
  (18, 18, 'جيجل',             'Jijel',             600),
  (19, 19, 'سطيف',             'Sétif',             550),
  (20, 20, 'سعيدة',            'Saïda',             650),
  (21, 21, 'سكيكدة',           'Skikda',            600),
  (22, 22, 'سيدي بلعباس',      'Sidi Bel Abbès',    600),
  (23, 23, 'عنابة',            'Annaba',            600),
  (24, 24, 'قالمة',            'Guelma',            600),
  (25, 25, 'قسنطينة',          'Constantine',       550),
  (26, 26, 'المدية',           'Médéa',             550),
  (27, 27, 'مستغانم',          'Mostaganem',        600),
  (28, 28, 'المسيلة',          'M''Sila',           600),
  (29, 29, 'معسكر',            'Mascara',           600),
  (30, 30, 'ورقلة',            'Ouargla',           800),
  (31, 31, 'وهران',            'Oran',              500),
  (32, 32, 'البيض',            'El Bayadh',         800),
  (33, 33, 'إليزي',            'Illizi',            1200),
  (34, 34, 'برج بوعريريج',     'Bordj Bou Arréridj',550),
  (35, 35, 'بومرداس',          'Boumerdès',         450),
  (36, 36, 'الطارف',           'El Tarf',           650),
  (37, 37, 'تندوف',            'Tindouf',           1200),
  (38, 38, 'تيسمسيلت',         'Tissemsilt',        650),
  (39, 39, 'الوادي',           'El Oued',           800),
  (40, 40, 'خنشلة',            'Khenchela',         650),
  (41, 41, 'سوق أهراس',        'Souk Ahras',        650),
  (42, 42, 'تيبازة',           'Tipaza',            450),
  (43, 43, 'ميلة',             'Mila',              600),
  (44, 44, 'عين الدفلى',       'Aïn Defla',         550),
  (45, 45, 'النعامة',          'Naâma',             850),
  (46, 46, 'عين تموشنت',       'Aïn Témouchent',    600),
  (47, 47, 'غرداية',           'Ghardaïa',          800),
  (48, 48, 'غليزان',           'Relizane',          600),
  (49, 49, 'المغير',           'El M''Ghair',       850),
  (50, 50, 'المنيعة',          'El Meniaa',         900),
  (51, 51, 'أولاد جلال',       'Ouled Djellal',     800),
  (52, 52, 'برج باجي مختار',   'Bordj Baji Mokhtar',1200),
  (53, 53, 'بني عباس',         'Béni Abbès',        1000),
  (54, 54, 'تيميمون',          'Timimoun',          1000),
  (55, 55, 'تقرت',             'Touggourt',         850),
  (56, 56, 'جانت',             'Djanet',            1200),
  (57, 57, 'عين صالح',         'In Salah',          1100),
  (58, 58, 'عين قزام',         'In Guezzam',        1200)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Demo seller account: seller@mahalli.app / Mahalli123!
-- ----------------------------------------------------------------------------
do $$
declare
  v_uid uuid;
  v_store_id uuid;
begin
  select id into v_uid from auth.users where email = 'seller@mahalli.app' limit 1;

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'seller@mahalli.app',
      crypt('Mahalli123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"أمين بلقاسم"}'::jsonb,
      now(), now(),
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, 'email',
            jsonb_build_object('sub', v_uid::text, 'email', 'seller@mahalli.app'),
            'email', now(), now(), now())
    on conflict do nothing;
  end if;

  insert into public.profiles (id, full_name)
  values (v_uid, 'أمين بلقاسم')
  on conflict (id) do nothing;

  -- Demo store
  insert into public.stores (owner_id, name, slug, bio, whatsapp, instagram, facebook, default_delivery_fee)
  values (
    v_uid,
    'متجر الزهور',
    'flower-shop',
    'متجر جزائري متخصص في الهدايا والزهور الاصطناعية ولوازم المناسبات. منتجات أصلية بأسعار مناسبة، والتوصيل متوفر إلى جميع الولايات الـ58 مع الدفع عند الاستلام.',
    '213555123456',
    'https://instagram.com/matajar.alzohour',
    'https://facebook.com/matajar.alzohour',
    500
  )
  on conflict (slug) do nothing;

  select id into v_store_id from public.stores where slug = 'flower-shop';

  -- Demo products
  insert into public.products (store_id, name, slug, description, price, stock, active) values
    (v_store_id,
     'باقة ورد صناعي فاخر',
     'bouquet-roses',
     'باقة ورد صناعي عالية الجودة بألوان ثابتة لا تبهت، مثالية لهدايا الأعراس والمناسبات. تأتي الباقة مغلّفة بشكل أنيق مع شريط ساتان، ويامكنك اختيار اللون عند التأكيد عبر واتساب.',
     4500, 12, true),
    (v_store_id,
     'سلة هدايا المناسبات',
     'gift-basket',
     'سلة هدايا مرتبة يدويًا تتضمن شوكولاتة فاخرة، شمعة معطرة، وحتى عصرة مجانية. خيار مثالي لعيد الميلاد، خطوبة المولودة أو تهاني الشركات. يمكنك تخصيص محتوى السلة حسب ميزانيتك.',
     5500, 8, true),
    (v_store_id,
     'عطر عود ملكي 50 مل',
     'perfume-oud',
     'عطر عود شرقي بثبات يصل إلى 8 ساعات، مزيج من العود الكمبودي والمسك والعنبر. عبوة زجاجية أنيقة بسعة 50 مل، مناسبة للرجال والنساء. منتج أصلي مضمون مع فاتورة.',
     6800, 15, true),
    (v_store_id,
     'طقم شموع معطرة 3 قطع',
     'candles-set',
     'ثلاث شموع صويا معطرة برائحة الفانيليا واللافندر والورد، تحترق حتى 20 ساعة لكل شمعة. تمنح المنزل أجواء هادئة ودافئة، وتصلح للديكور أو للهدية.',
     1800, 30, true),
    (v_store_id,
     'طقم أكواب قهوة مغربية',
     'coffee-cups',
     'ستة أكواب قهوة بزجاج مقوى مزخرف بنقوش ذهبية على الطراز المغربي الأندلسي، مقاومة للحرارة وآمنة في غسالة الأواني. أنيقة على الطاولة وأصلية كهدية.',
     3200, 10, true),
    (v_store_id,
     'لوحة جدارية بخط عربي',
     'wall-art',
     'لوحة خشب مضلّف بنقش خط عربي يدوي "ما شاء الله لا قوة إلا بالله"، مقاس 60×30 سم مع علاقة جاهزة للتعليق. تشطيب مطفي فاخر يناسب الصالونات والمكاتب.',
     2600, 6, true)
  on conflict (store_id, slug) do nothing;

  -- Demo product images (bundled with the app under /public/demo)
  insert into public.product_images (product_id, storage_path, public_url, sort_order)
  select p.id, 'demo/' || p.slug || '.svg', '/demo/' || p.slug || '.svg', 0
  from public.products p
  where p.store_id = v_store_id
    and not exists (select 1 from public.product_images i where i.product_id = p.id);

  -- Example per-wilaya fee overrides (Alger and Blida cheaper than default)
  insert into public.store_delivery_fees (store_id, wilaya_id, fee)
  select v_store_id, w.id, w.fee
  from (values (16, 400::numeric), (9, 450::numeric)) as w(id, fee)
  where not exists (
    select 1 from public.store_delivery_fees f
    where f.store_id = v_store_id and f.wilaya_id = w.id
  );
end $$;
