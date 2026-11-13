import type { CSSProperties, ReactNode } from "react";
import { getChapter, type ChapterId, type ProgressWindow } from "@/lib/chapters";
import { cn } from "@/lib/utils";

interface StoryChapterProps {
  id: ChapterId;
  labelledBy: string;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}

/**
 * One chapter of the Home story (Spesifikasi Lanjutan 9.1). With the story on,
 * the section is as tall as its scroll range and its panel sticks to the
 * viewport while the camera moves; without it (reduced motion, no JavaScript)
 * it is an ordinary section. Inverted chapters carry `surface-inverse`, which
 * paints their background only when the story is off.
 */
export function StoryChapter({ id, labelledBy, className, panelClassName, children }: StoryChapterProps) {
  const chapter = getChapter(id);
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={labelledBy}
      data-chapter={id}
      className={cn("story-chapter relative outline-none", chapter.inverted && "surface-inverse", className)}
      style={
        {
          "--chapter-h": chapter.height.desktop,
          "--chapter-h-mobile": chapter.height.mobile,
        } as CSSProperties
      }
    >
      <div className={cn("story-panel relative", panelClassName)}>{children}</div>
    </section>
  );
}

/** Inline style that ties an element to a rest pose (`[data-beat]` in globals.css). */
export function beatStyle(window: ProgressWindow): CSSProperties {
  return { "--beat-start": window.start, "--beat-end": window.end } as CSSProperties;
}

/** From a chapter's first rest to its last: for a header shown throughout. */
export function chapterSpan(id: ChapterId): ProgressWindow {
  const { rests } = getChapter(id);
  return { start: rests[0]!.start, end: rests[rests.length - 1]!.end };
}
