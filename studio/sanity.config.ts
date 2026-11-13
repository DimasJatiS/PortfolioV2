import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { assertConfigured, dataset, projectId } from "./env";
import { schemaTypes, SINGLETON_TYPES } from "./schemaTypes";
import { structure } from "./structure";

assertConfigured();

export default defineConfig({
  name: "summit",
  title: "Summit — Portfolio",
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Singletons are edited in place; they cannot be created from "New document".
    templates: (templates) =>
      templates.filter((template) => !SINGLETON_TYPES.has(template.schemaType)),
  },
  document: {
    // ...and cannot be duplicated or deleted.
    actions: (actions, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? actions.filter(
            (action) =>
              action.action &&
              ["publish", "discardChanges", "restore"].includes(action.action),
          )
        : actions,
  },
});
