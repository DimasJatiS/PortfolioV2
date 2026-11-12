import {
  activity,
  article,
  experience,
  labExperiment,
  project,
  skill,
} from "./documents";
import { blockContent, localeBlock, localeString, localeText } from "./locale";
import { siteSettings } from "./siteSettings";

/** Seven document types plus the bilingual helper types (content model, section 8). */
export const schemaTypes = [
  // helpers
  localeString,
  localeText,
  localeBlock,
  blockContent,
  // documents
  siteSettings,
  project,
  activity,
  experience,
  skill,
  article,
  labExperiment,
];

export const SINGLETON_TYPES = new Set(["siteSettings"]);
