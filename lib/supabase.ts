import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function authClient(readOnly = false) {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Configure o Supabase em .env.local.");
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(items) {
        if (!readOnly) for (const { name, value, options } of items) jar.set(name, value, options);
      },
    },
  });
}
