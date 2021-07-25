import { Entry } from "contentful";
import { contentfulClient } from "./client";

interface IngredientCategory {
  name: string;
}

interface Ingredient {
  name: string;
  category: IngredientCategory;
}

export type IngredientEntry = Entry<
  Ingredient & { category: Entry<IngredientCategory> }
>;

export async function fetchIngredients(): Promise<IngredientEntry[]> {
  const entries = await contentfulClient.getEntries<
    Ingredient & { category: Entry<IngredientCategory> }
  >({
    content_type: "ingredient",
    locale: "pl",
  });

  return entries.items;
}
