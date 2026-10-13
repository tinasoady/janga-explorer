import type { SupabaseClient } from "@supabase/supabase-js";
import {
  toManaged,
  type ManagedBusiness,
  type ManagedBusinessRow,
  type ManagedOffer,
  type ManagedOfferRow,
} from "./managed";

// Lectures de l'espace pro. Le client reçu est celui de la personne connectée :
// les règles RLS garantissent qu'elle ne voit que son établissement et ses offres.

export async function getMyBusiness(supabase: SupabaseClient, userId: string): Promise<ManagedBusiness | null> {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, kind, whatsapp, phone")
    .eq("owner_id", userId)
    .maybeSingle<ManagedBusinessRow>();
  return data;
}

export async function getMyOffers(supabase: SupabaseClient, businessId: string): Promise<ManagedOffer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .returns<ManagedOfferRow[]>();
  if (error) throw new Error(`Chargement de vos offres impossible : ${error.message}`);
  return data.map(toManaged).filter((o): o is ManagedOffer => o !== null);
}

export async function getMyOffer(
  supabase: SupabaseClient,
  businessId: string,
  offerId: string,
): Promise<ManagedOffer | null> {
  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", offerId)
    .maybeSingle<ManagedOfferRow>();
  return data ? toManaged(data) : null;
}

export type MyProRequest = {
  company: string;
  kind: string;
  locality: string;
  capacity: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
};

/** Ma demande de compte pro (null pour un compte sans demande, par exemple un administrateur). */
export async function getMyProRequest(supabase: SupabaseClient, userId: string): Promise<MyProRequest | null> {
  const { data } = await supabase
    .from("pro_requests")
    .select("company, kind, locality, capacity, status, rejection_reason")
    .eq("user_id", userId)
    .maybeSingle<{
      company: string;
      kind: string;
      locality: string;
      capacity: number;
      status: MyProRequest["status"];
      rejection_reason: string | null;
    }>();
  if (!data) return null;
  return {
    company: data.company,
    kind: data.kind,
    locality: data.locality,
    capacity: data.capacity,
    status: data.status,
    rejectionReason: data.rejection_reason,
  };
}
