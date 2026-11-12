import { defineField, defineType, type FieldDefinition } from "sanity";

/**
 * Bilingual helper types (content model, section 8). Translations live on the
 * field, not in separate documents, so a project is edited in one place.
 * English is required; Indonesian may be empty and falls back to English on
 * the website.
 */

const languageFields = (type: "string" | "text" | "blockContent"): FieldDefinition[] => [
  defineField({
    name: "en",
    title: "English",
    type,
    ...(type === "text" ? { rows: 3 } : {}),
    validation: (rule) => rule.required(),
  } as FieldDefinition),
  defineField({
    name: "id",
    title: "Bahasa Indonesia",
    description: "Optional. Falls back to English when empty.",
    type,
    ...(type === "text" ? { rows: 3 } : {}),
  } as FieldDefinition),
];

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  fields: languageFields("string"),
  options: { columns: 2 },
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  fields: languageFields("text"),
});

export const localeBlock = defineType({
  name: "localeBlock",
  title: "Localized rich text",
  type: "object",
  fields: languageFields("blockContent"),
});

/** Portable Text used by case studies and articles: headings, lists, images, code. */
export const blockContent = defineType({
  name: "blockContent",
  title: "Rich text",
  type: "array",
  of: [
    {
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) =>
                  rule.required().uri({ scheme: ["http", "https", "mailto"] }),
              },
            ],
          },
        ],
      },
    },
    {
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alternative text",
          description: "Describe the image for people who cannot see it.",
          type: "string",
          validation: (rule) => rule.required(),
        },
        { name: "caption", title: "Caption", type: "string" },
      ],
    },
    {
      name: "codeBlock",
      title: "Code block",
      type: "object",
      fields: [
        { name: "language", title: "Language", type: "string" },
        { name: "filename", title: "File name", type: "string" },
        {
          name: "code",
          title: "Code",
          type: "text",
          rows: 10,
          validation: (rule) => rule.required(),
        },
      ],
      preview: {
        select: { title: "filename", subtitle: "language" },
        prepare: ({ title, subtitle }) => ({
          title: title || "Code block",
          subtitle: subtitle || "plain text",
        }),
      },
    },
  ],
});
