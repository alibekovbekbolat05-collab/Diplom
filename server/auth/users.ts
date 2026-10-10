import { z } from "zod";
const userSchema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.toLowerCase()),
  passwordHash: z
    .string()
    .regex(/^\$2[aby]\$\d{2}\$/)
    .min(59)
    .max(72),
  role: z.enum(["admin", "analyst", "viewer"]),
});
export function users() {
  const list: z.infer<typeof userSchema>[] = [];
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    const admin = userSchema.safeParse({
      email: process.env.ADMIN_EMAIL,
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin",
    });
    if (admin.success) list.push(admin.data);
  }
  if (process.env.USERS_JSON) {
    try {
      const extra = z
        .array(userSchema)
        .max(100)
        .safeParse(JSON.parse(process.env.USERS_JSON));
      if (extra.success) list.push(...extra.data);
    } catch {}
  }
  return list;
}
