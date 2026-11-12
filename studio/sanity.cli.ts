import { defineCliConfig } from "sanity/cli";
import { dataset, projectId, studioHost } from "./env";

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost,
});
