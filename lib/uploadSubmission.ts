import { supabase } from "@/lib/supabase";

export async function uploadSubmission(file: File) {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("submissions")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("submissions")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
