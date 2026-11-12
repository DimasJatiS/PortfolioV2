import { defineArrayMember, defineField, defineType } from "sanity";

const imageWithAlt = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
        validation: (rule) => rule.required(),
      }),
    ],
  });

const httpUrl = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "url",
    validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
  });

export const skill = defineType({
  name: "skill",
  title: "Skill",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "beam",
      title: "Beam",
      description:
        "Which beam of the skill spectrum on Home this belongs to. Leave empty for a skill that is only used as a project stack tag.",
      type: "string",
      options: {
        list: [
          { title: "Frontend & Creative", value: "frontend-creative" },
          { title: "Backend & Data", value: "backend-data" },
          { title: "Mobile & AI", value: "mobile-ai" },
          { title: "Design & Collaboration", value: "design-collab" },
        ],
      },
    }),
    defineField({ name: "order", title: "Order within the beam", type: "number" }),
  ],
  orderings: [
    {
      name: "beamOrder",
      title: "Beam, then order",
      by: [
        { field: "beam", direction: "asc" },
        { field: "order", direction: "asc" },
      ],
    },
  ],
  preview: { select: { title: "name", subtitle: "beam" } },
});

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  groups: [
    { name: "card", title: "Card", default: true },
    { name: "caseStudy", title: "Case study" },
    { name: "media", title: "Media & links" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "card",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "card",
      options: { source: "title", maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "number",
      title: "Number",
      description: "01, 02… Controls the display order.",
      type: "number",
      group: "card",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      description: "Shown as a shard on Home. Keep it to three projects.",
      type: "boolean",
      group: "card",
      initialValue: false,
    }),
    defineField({
      name: "category",
      title: "Categories",
      type: "array",
      group: "card",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "Web", value: "web" },
          { title: "Mobile", value: "mobile" },
          { title: "AI", value: "ai" },
          { title: "Creative", value: "creative" },
        ],
      },
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "summary", title: "Summary", type: "localeText", group: "card" }),
    defineField({
      name: "stack",
      title: "Stack",
      type: "array",
      group: "card",
      of: [defineArrayMember({ type: "reference", to: [{ type: "skill" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "localeString",
      group: "caseStudy",
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "localeString",
      group: "caseStudy",
    }),
    defineField({
      name: "problem",
      title: "The problem",
      type: "localeBlock",
      group: "caseStudy",
    }),
    defineField({
      name: "process",
      title: "Process",
      type: "localeBlock",
      group: "caseStudy",
    }),
    defineField({
      name: "decisions",
      title: "Key decisions",
      type: "localeBlock",
      group: "caseStudy",
    }),
    defineField({
      name: "result",
      title: "Result",
      type: "localeBlock",
      group: "caseStudy",
    }),
    defineField({
      name: "metrics",
      title: "Metrics",
      type: "array",
      group: "caseStudy",
      of: [
        defineArrayMember({
          type: "object",
          name: "metric",
          fields: [
            defineField({ name: "label", title: "Label", type: "localeString" }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "value", subtitle: "label.en" } },
        }),
      ],
    }),
    { ...imageWithAlt("cover", "Cover"), group: "media" },
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alternative text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
    }),
    { ...httpUrl("video", "Preview video URL"), group: "media" },
    { ...httpUrl("liveUrl", "Live URL"), group: "media" },
    { ...httpUrl("repoUrl", "Repository URL"), group: "media" },
    defineField({
      name: "publishedAt",
      title: "Published",
      type: "date",
      group: "media",
    }),
  ],
  orderings: [
    { name: "number", title: "Number", by: [{ field: "number", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", number: "number", featured: "featured", media: "cover" },
    prepare: ({ title, number, featured, media }) => ({
      title,
      subtitle: `${number ? String(number).padStart(2, "0") : "--"}${featured ? " · featured" : ""}`,
      media,
    }),
  },
});

export const activity = defineType({
  name: "activity",
  title: "Activity",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Event", value: "event" },
          { title: "Competition", value: "competition" },
          { title: "Certification", value: "certification" },
          { title: "Learning", value: "learning" },
          { title: "Release", value: "release" },
          { title: "Organization", value: "organization" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      description: "Optional, one or two sentences.",
      type: "localeText",
    }),
    httpUrl("link", "Link"),
    defineField({
      name: "showOnHome",
      title: "Candidate for the Recently strip on Home",
      description: "The three most recent flagged items are shown.",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      name: "dateDesc",
      title: "Newest first",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: { select: { title: "title.en", subtitle: "date" } },
});

export const experience = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "organization",
      title: "Organization",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "position",
      title: "Position",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: {
        list: [
          { title: "Education", value: "education" },
          { title: "Work", value: "work" },
          { title: "Organization", value: "organization" },
          { title: "Committee", value: "committee" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "start", title: "Start", type: "date" }),
    defineField({
      name: "end",
      title: "End",
      description: "Leave empty if this is current.",
      type: "date",
      validation: (rule) => rule.min(rule.valueOfField("start")),
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      description: "Bullet points for the résumé.",
      type: "array",
      of: [defineArrayMember({ type: "localeString" })],
    }),
  ],
  preview: { select: { title: "position.en", subtitle: "organization" } },
});

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.en", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      description: "Two lines on the article card.",
      type: "localeText",
    }),
    defineField({ name: "category", title: "Category", type: "string" }),
    defineField({
      name: "body",
      title: "Body",
      description: "Reading time is calculated automatically.",
      type: "localeBlock",
    }),
    defineField({
      name: "cover",
      title: "Cover",
      description: "Fallback share image.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "publishedAt", title: "Published", type: "date" }),
  ],
  orderings: [
    {
      name: "publishedDesc",
      title: "Newest first",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: { select: { title: "title.en", subtitle: "publishedAt", media: "cover" } },
});

export const labExperiment = defineType({
  name: "labExperiment",
  title: "Lab experiment",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title.en", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "localeText" }),
    defineField({
      name: "componentKey",
      title: "Component key",
      description: "Name of the React component to render, e.g. geometric-light.",
      type: "string",
      validation: (rule) =>
        rule.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "kebab-case" }),
    }),
    defineField({
      name: "params",
      title: "Shader parameters",
      description: "Each becomes a small slider next to the experiment.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "param",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "min", title: "Min", type: "number" }),
            defineField({ name: "max", title: "Max", type: "number" }),
            defineField({ name: "default", title: "Default", type: "number" }),
          ],
          preview: { select: { title: "name" } },
        }),
      ],
    }),
    defineField({ name: "credit", title: "Credit", type: "localeString" }),
    httpUrl("sourceUrl", "Source URL"),
  ],
  preview: { select: { title: "title.en", subtitle: "componentKey" } },
});
