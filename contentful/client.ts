import { createClient } from "contentful";

const space = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;

export interface ContentfulEntry<T> {
  fields: T;
  sys: {
    id: string;
  };
}

export const contentfulClient = createClient({
  space: space,
  accessToken: accessToken,
});

export function mapContentfulEntry<T>(contentfulItem: ContentfulEntry<T>): T & { id: string } {
  const { fields, ...contentful } = contentfulItem;
  return {
    id: contentful.sys.id,
    ...contentfulItem.fields,
    contentful,
  };
}

