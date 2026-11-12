import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/dom/Button";
import { KineticText } from "@/components/ui/kinetic-text";
import { Meteors } from "@/components/ui/meteors";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden">
      <Meteors number={12} />
      <div className="container-page relative flex flex-col items-start gap-6 py-32">
        <p className="type-label text-accent-text">404</p>
        <KineticText
          as="h1"
          text={t("title")}
          className="type-designer text-heading text-step-4 md:text-step-5 block"
        />
        <p className="text-muted max-w-[46ch]">{t("body")}</p>
        <ButtonLink href="/">{t("cta")}</ButtonLink>
      </div>
    </section>
  );
}
