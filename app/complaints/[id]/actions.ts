"use server";

import { updateTag } from "next/cache";

export async function revalidateComplaint() {
  updateTag("complaint");
}