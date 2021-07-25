import { Entry } from "contentful";

export interface IngredientCategory {
  id: string;
  name: string;
}

export type IngredientCategoryEntry = Entry<IngredientCategory>;

export function unwrapIngredientCategoryEntry(entry: IngredientCategoryEntry): IngredientCategory {
  return {
    ...entry.fields,
    id: entry.sys.id,
  }
}