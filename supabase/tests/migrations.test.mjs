// Rejoue toutes les migrations dans PGlite (Postgres embarqué, avec des bouchons auth/storage façon Supabase)
// et vérifie les règles de l'abonnement des comptes pro. Lancer : npm run db:test
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
`);

for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  try {
    await db.exec(readFileSync(join(dir, f), "utf8"));
    console.log("migration ok:", f);
  } catch (e) {
    console.error("migration FAILED:", f, e.message);
    process.exit(1);
  }
}

const S = "00000000-0000-0000-0000-000000000001";
const A = "00000000-0000-0000-0000-000000000002";
const P = "00000000-0000-0000-0000-000000000003";
const Q = "00000000-0000-0000-0000-000000000004";
const meta = (c) => JSON.stringify({ full_name: "Nom", company: c, kind: "restaurant", locality: "Mahajanga", capacity: "20", justification: "NIF 123" });

await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${S}', 's@x.mg', '{}'), ('${A}', 'a@x.mg', '{}'),
    ('${P}', 'p@x.mg', '${meta("Chez P")}'), ('${Q}', 'q@x.mg', '${meta("Chez Q")}');
  update public.profiles set role = 'superadmin' where id = '${S}';
  update public.profiles set role = 'admin' where id = '${A}';
`);

let failures = 0;
const check = (label, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? " -> " + extra : ""}`);
  if (!ok) failures++;
};

async function as(user, sql, params) {
  await db.exec(user ? `set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);` : "reset role;");
  try {
    return { rows: (await db.query(sql, params)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec("reset role;");
  }
}
const one = async (user, sql) => (await as(user, sql)).rows?.[0];

// Approbation : essai ouvert
check("approve P", (await one(S, `select public.review_pro_request('${P}', true) r`))?.r === "ok");
check("approve Q", (await one(S, `select public.review_pro_request('${Q}', true) r`))?.r === "ok");
const subP = await one(null, `select trial_ends_at > now() + interval '29 days' ok from public.subscriptions where user_id = '${P}'`);
check("P trial ~30 days", subP?.ok === true);
check("P has active sub", (await one(P, "select public.has_active_subscription() r"))?.r === true);

// Le pro publie pendant l'essai
const biz = await as(P, `insert into public.businesses (name, kind, whatsapp, owner_id) values ('Chez P', 'Resto', '261341234567', '${P}') returning id`);
check("P creates business", !!biz.rows, biz.error);
const bizP = biz.rows[0].id;
const offerSql = (b, slug) => `insert into public.offers (business_id, slug, title, description, category, image_url, price_offer, location, valid_until, status)
  values ('${b}', '${slug}', 'Menu duo', 'Une super offre de test', 'manger', 'https://x.supabase.co/a.jpg', 10000, 'Mahajanga', current_date + 10, 'pending') returning id`;
const offP = await as(P, offerSql(bizP, "menu-p"));
check("P creates offer during trial", !!offP.rows, offP.error);

// Paiement : montant imposé par la base
const pay = await as(P, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path, status)
  values ('${P}', 3, 1, 'mvola', '0341234567', 'TX123', '${P}/a.png', 'confirmed') returning id, amount, status`);
check("P declares payment", !!pay.rows, pay.error);
check("amount = 3 x 20000, status pending", pay.rows?.[0].amount === 60000 && pay.rows?.[0].status === "pending", JSON.stringify(pay.rows?.[0]));
const payId = pay.rows[0].id;
const dup = await as(P, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path)
  values ('${P}', 1, 0, 'orange_money', '0321234567', 'TX999', '${P}/b.png')`);
check("second pending payment refused", !!dup.error, dup.error);
const badPath = await as(Q, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path)
  values ('${Q}', 1, 0, 'mvola', '0341234567', 'TX-Q', '${P}/a.png')`);
check("proof in another folder refused", !!badPath.error, badPath.error);
const sameRef = await as(Q, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path)
  values ('${Q}', 1, 0, 'mvola', '0341234567', 'tx123', '${Q}/a.png')`);
check("same transaction reference refused", !!sameRef.error, sameRef.error);
const selfUpdate = await as(P, `update public.subscription_payments set status = 'confirmed' where id = '${payId}' returning id`);
check("pro cannot confirm own payment", (selfUpdate.rows ?? []).length === 0, selfUpdate.error);
const proConfirm = await as(P, `select public.review_subscription_payment('${payId}', true) r`);
check("pro cannot call review function", !!proConfirm.error, proConfirm.error);

// Confirmation par un admin simple
const trialEnd = (await one(null, `select trial_ends_at t from public.subscriptions where user_id = '${P}'`)).t;
check("admin confirms payment", (await one(A, `select public.review_subscription_payment('${payId}', true) r`))?.r === "ok");
const after = await one(null, `select paid_until, round(extract(epoch from paid_until - trial_ends_at) / 86400) d from public.subscriptions where user_id = '${P}'`);
check("paid_until = trial end + 90 days", Number(after.d) === 90, `${after.d} days after ${trialEnd.toISOString()}`);
check("re-review refused", (await one(A, `select public.review_subscription_payment('${payId}', false) r`))?.r === "already_reviewed");

// Q expire : plus de publication, mais il peut retirer ses offres
const bizQ = (await as(Q, `insert into public.businesses (name, kind, phone, owner_id) values ('Chez Q', 'Resto', '0341234567', '${Q}') returning id`)).rows[0].id;
const offQ = (await as(Q, offerSql(bizQ, "menu-q"))).rows[0].id;
await db.exec(`update public.offers set status = 'published' where id = '${offQ}'`);
await db.exec(`update public.subscriptions set trial_ends_at = now() - interval '1 day' where user_id = '${Q}'`);
check("Q no longer active", (await one(Q, "select public.has_active_subscription() r"))?.r === false);
const newOffQ = await as(Q, offerSql(bizQ, "menu-q2"));
check("expired Q cannot create offer", !!newOffQ.error, newOffQ.error);
const editQ = await as(Q, `update public.offers set title = 'Menu trio' where id = '${offQ}'`);
check("expired Q cannot edit (resubmit) offer", !!editQ.error, editQ.error);
const archQ = await as(Q, `update public.offers set status = 'archived' where id = '${offQ}' returning status`);
check("expired Q can archive offer", archQ.rows?.[0]?.status === "archived", archQ.error);
const resubQ = await as(Q, `update public.offers set status = 'pending' where id = '${offQ}'`);
check("expired Q cannot resubmit", !!resubQ.error, resubQ.error);
const adminEdit = await as(A, `update public.offers set status = 'published' where id = '${offQ}' returning status`);
check("admin can still publish Q offer", adminEdit.rows?.[0]?.status === "published", adminEdit.error);

// Paiement de Q après expiration : la période démarre à la confirmation
const payQ = (await as(Q, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path)
  values ('${Q}', 1, 0, 'airtel_money', '0331234567', 'AIR-1', '${Q}/p.png') returning id`)).rows[0].id;
check("admin confirms Q", (await one(A, `select public.review_subscription_payment('${payQ}', true) r`))?.r === "ok");
const q2 = await one(null, `select round(extract(epoch from paid_until - now()) / 86400) d from public.subscriptions where user_id = '${Q}'`);
check("Q paid ~30 days from now", Number(q2.d) === 30, q2.d);
check("Q can publish again", !!(await as(Q, offerSql(bizQ, "menu-q3"))).rows);

// Superadmin : jours offerts, annulation, réactivation
check("admin cannot grant days", !!(await as(A, `select public.grant_subscription_days('${Q}', 10)`)).error);
const beforeGrant = (await one(null, `select paid_until p from public.subscriptions where user_id = '${Q}'`)).p;
check("superadmin grants 10 days", (await one(S, `select public.grant_subscription_days('${Q}', 10) r`))?.r === "ok");
const g = await one(null, `select round(extract(epoch from paid_until - '${beforeGrant.toISOString()}'::timestamptz) / 86400) d from public.subscriptions where user_id = '${Q}'`);
check("grant adds 10 days", Number(g.d) === 10, g.d);
check("admin cannot cancel", !!(await as(A, `select public.cancel_subscription('${P}', 'x')`)).error);
check("superadmin cancels P", (await one(S, `select public.cancel_subscription('${P}', 'Fraude') r`))?.r === "ok");
check("canceled P not active", (await one(P, "select public.has_active_subscription() r"))?.r === false);
const payCanceled = await as(P, `insert into public.subscription_payments (user_id, months, amount, method, payer_phone, reference, proof_path)
  values ('${P}', 1, 0, 'mvola', '0341234567', 'TX-C', '${P}/c.png')`);
check("canceled P cannot declare payment", !!payCanceled.error, payCanceled.error);
check("superadmin reactivates P", (await one(S, `select public.reactivate_subscription('${P}') r`))?.r === "ok");
check("reactivated P active again", (await one(P, "select public.has_active_subscription() r"))?.r === true);

// Lecture
const listA = await as(A, "select * from public.list_subscriptions()");
check("admin lists subscriptions with emails", listA.rows?.length === 2 && listA.rows.every((r) => r.email && r.company), JSON.stringify(listA.rows?.map((r) => [r.email, r.company, r.pro_approved])));
check("pro lists nothing", (await as(P, "select * from public.list_subscriptions()")).rows?.length === 0);
check("pro sees only own subscription", (await as(P, "select * from public.subscriptions")).rows?.length === 1);
check("pro sees only own payments", (await as(Q, "select * from public.subscription_payments")).rows?.every((r) => r.user_id === Q));

// Réglages
check("admin cannot change price", ((await as(A, "update public.subscription_settings set monthly_price = 1 returning id")).rows ?? []).length === 0);
check("superadmin changes price", (await as(S, "update public.subscription_settings set monthly_price = 25000 returning id")).rows?.length === 1);
await db.exec("reset role;");
await db.exec("set role anon;");
const anonSettings = (await db.query("select monthly_price from public.subscription_settings")).rows;
await db.exec("reset role;");
check("anon reads price", anonSettings[0]?.monthly_price === 25000);

// Stockage des preuves
check("P uploads proof in own folder", !!(await as(P, `insert into storage.objects (bucket_id, name) values ('payment-proofs', '${P}/x.png') returning id`)).rows);
check("P cannot upload in Q folder", !!(await as(P, `insert into storage.objects (bucket_id, name) values ('payment-proofs', '${Q}/x.png')`)).error);
check("Q cannot read P proof", (await as(Q, `select * from storage.objects where bucket_id = 'payment-proofs'`)).rows?.length === 0);
check("admin reads P proof", (await as(A, `select * from storage.objects where bucket_id = 'payment-proofs'`)).rows?.length === 1);

// Réapprobation : pas de nouvel essai
await db.exec(`update public.subscriptions set trial_ends_at = now() - interval '5 days' where user_id = '${P}'`);
await one(S, `select public.review_pro_request('${P}', false, 'test')`);
await one(S, `select public.review_pro_request('${P}', true)`);
const reTrial = await one(null, `select trial_ends_at < now() past from public.subscriptions where user_id = '${P}'`);
check("re-approval keeps old trial", reTrial.past === true);

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
