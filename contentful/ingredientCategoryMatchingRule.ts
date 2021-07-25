import { Entry } from "contentful";
import { contentfulClient } from "./client";
import { IngredientCategory, IngredientCategoryEntry, unwrapIngredientCategoryEntry } from "./ingredientCategory";

export interface IngredientCategoryMatchingRule {
  id: string;
  contains: string;
  category: IngredientCategory;
}

type IngredientCategoryMatchingRuleEntry = Entry<Omit<IngredientCategoryMatchingRule, 'id'> & { category: IngredientCategoryEntry }>;

function unwrapEntry(entry: IngredientCategoryMatchingRuleEntry): IngredientCategoryMatchingRule {
  return {
    ...entry.fields,
    category: unwrapIngredientCategoryEntry(entry.fields.category), 
    id: entry.sys.id,
  }
}

export async function fetchMatchingRules(): Promise<IngredientCategoryMatchingRule[]> {
  const entries = await contentfulClient.getEntries<
    IngredientCategoryMatchingRule & { category: IngredientCategoryEntry }
  >({
    content_type: "ingredientCategoryMatchingRule",
    locale: "pl",
  });

  return entries.items.map(unwrapEntry);
}
