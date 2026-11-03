"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createRideForUser } from "@/lib/rides";

export interface AddRideState {
  error?: string;
  success?: boolean;
}

export async function addRide(_prevState: AddRideState, formData: FormData): Promise<AddRideState> {
  const valueReceived = Number(formData.get("valueReceived"));
  const kmDriven = Number(formData.get("kmDriven"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const result = await createRideForUser(supabase, user.id, { valueReceived, kmDriven });
  if (result.error) return { error: result.error };

  revalidatePath("/");
  return { success: true };
}
