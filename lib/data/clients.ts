import { createServerClient } from "@/lib/db/server";
import type { Client } from "@/lib/types";

export async function getAllClients(): Promise<Client[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`getAllClients: ${error.message}`);
  return data ?? [];
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getClientById: ${error.message}`);
  return data;
}
