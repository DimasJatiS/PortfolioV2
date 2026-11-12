import { defineQuery } from "next-sanity";

/**
 * GROQ queries. Each projection resolves bilingual fields to `$locale` and falls
 * back to English when the Indonesian value is empty (content model rule), so
 * the frontend only ever sees plain strings.
 *
 * The same queries run against Sanity and, through groq-js, against the local
 * seed dataset; `tests/content.test.ts` checks every one of them.
 */

const PROJECT_FIELDS = /* groq */ `
  "id": _id,
  title,
  "slug": slug.current,
  number,
  featured,
  "categories": category,
  "summary": coalesce(summary[$locale], summary.en),
  "role": coalesce(role[$locale], role.en),
  "duration": coalesce(duration[$locale], duration.en),
  "stack": stack[]->name,
  liveUrl,
  repoUrl,
  publishedAt,
  "hasCaseStudy": defined(problem.en)
`;

export const siteSettingsQuery = defineQuery(/* groq */ `
  *[_type == "siteSettings"][0]{
    name,
    role,
    "headline": coalesce(headline[$locale], headline.en),
    "statement": coalesce(statement[$locale], statement.en),
    "manifesto": manifesto[]{ "line": coalesce(@[$locale], en) }.line,
    "bioShort": coalesce(bioShort[$locale], bioShort.en),
    "bioLong": coalesce(bioLong[$locale], bioLong.en),
    showAvailability,
    availability{ startMonth, minMonths, mode },
    "cvUrl": cv.asset->url,
    "socials": socials[]{ platform, url },
    "interests": interests[]{ "line": coalesce(@[$locale], en) }.line,
    "currentlyLearning": currentlyLearning[]{ "line": coalesce(@[$locale], en) }.line,
    "seoTitle": coalesce(seo.title[$locale], seo.title.en),
    "seoDescription": coalesce(seo.description[$locale], seo.description.en)
  }
`);

export const skillsQuery = defineQuery(/* groq */ `
  *[_type == "skill"] | order(order asc, name asc){
    "id": _id,
    name,
    beam,
    order
  }
`);

/** Featured first, then by display number. */
export const projectsQuery = defineQuery(/* groq */ `
  *[_type == "project" && defined(slug.current)] | order(featured desc, number asc){
    ${PROJECT_FIELDS}
  }
`);

export const projectBySlugQuery = defineQuery(/* groq */ `
  *[_type == "project" && slug.current == $slug][0]{
    ${PROJECT_FIELDS}
  }
`);

export const activitiesQuery = defineQuery(/* groq */ `
  *[_type == "activity" && defined(date)] | order(date desc){
    "id": _id,
    "title": coalesce(title[$locale], title.en),
    type,
    date,
    "description": coalesce(description[$locale], description.en),
    link
  }
`);

/** Candidates for the "Recently" strip on Home: the three latest flagged items. */
export const recentActivitiesQuery = defineQuery(/* groq */ `
  *[_type == "activity" && defined(date) && showOnHome == true] | order(date desc)[0...3]{
    "id": _id,
    "title": coalesce(title[$locale], title.en),
    type,
    date,
    "description": coalesce(description[$locale], description.en),
    link
  }
`);

export const experiencesQuery = defineQuery(/* groq */ `
  *[_type == "experience"] | order(coalesce(end, "9999-12-31") desc, start desc){
    "id": _id,
    organization,
    "position": coalesce(position[$locale], position.en),
    kind,
    start,
    end,
    "highlights": highlights[]{ "line": coalesce(@[$locale], en) }.line
  }
`);

export const articlesQuery = defineQuery(/* groq */ `
  *[_type == "article" && defined(slug.current)] | order(publishedAt desc){
    "id": _id,
    "title": coalesce(title[$locale], title.en),
    "slug": slug.current,
    "excerpt": coalesce(excerpt[$locale], excerpt.en),
    category,
    publishedAt,
    "plainBody": pt::text(coalesce(body[$locale], body.en))
  }
`);

export const articleBySlugQuery = defineQuery(/* groq */ `
  *[_type == "article" && slug.current == $slug][0]{
    "id": _id,
    "title": coalesce(title[$locale], title.en),
    "slug": slug.current,
    "excerpt": coalesce(excerpt[$locale], excerpt.en),
    category,
    publishedAt,
    "plainBody": pt::text(coalesce(body[$locale], body.en))
  }
`);

export const labExperimentsQuery = defineQuery(/* groq */ `
  *[_type == "labExperiment" && defined(slug.current)] | order(_createdAt asc){
    "id": _id,
    "title": coalesce(title[$locale], title.en),
    "slug": slug.current,
    "description": coalesce(description[$locale], description.en),
    componentKey,
    "credit": coalesce(credit[$locale], credit.en),
    sourceUrl
  }
`);
