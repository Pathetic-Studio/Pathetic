// sanity/lib/fetch-page-loader.ts
import { client } from "./client";
import { PAGE_LOADER_QUERY } from "../queries/page-loader";

export type PageLoaderResult = Awaited<ReturnType<typeof fetchPageLoader>>;

export async function fetchPageLoader() {
  return client.fetch(PAGE_LOADER_QUERY);
}
