import type { StructureResolver } from "sanity/structure";

const LISTS: Array<{ type: string; title: string }> = [
  { type: "project", title: "Projects" },
  { type: "activity", title: "Activities" },
  { type: "experience", title: "Experience" },
  { type: "skill", title: "Skills" },
  { type: "article", title: "Articles" },
  { type: "labExperiment", title: "Lab experiments" },
];

/** Site settings first, as a single document; then one list per content type. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      ...LISTS.map(({ type, title }) => S.documentTypeListItem(type).title(title)),
    ]);
