import { z } from "zod";

export const collectCollectionInputSchema = z.object({
  profileId: z.string().cuid(),
});
