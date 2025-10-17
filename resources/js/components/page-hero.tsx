import { Fragment, type ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types";
import { Star, ShieldCheck, Users, KeyRound, CheckCircle2 } from "lucide-react";

type HeroSize = "sm" | "md" | "lg";
type Align = "left" | "center";

type Badge =
  | { text: string; icon?: ReactNode }
  | { text: string; iconClass?: string };

interface Gradient {
  from?: string; via?: string; to?: string;
  direction?: "to right" | "to bottom right" | "to top right" | "to bottom";
  overlayOpacity?: number; // 0..1
}

interface Media {
  imageUrl?: string;
  alt?: string;
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
  dimOpacity?: number; // 0..1
}

interface StatItem {
  icon?: ReactNode;
  iconClass?: string;
  value: string | number;
  label: string;
}

interface PageHeroProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  size?: HeroSize;
  align?: Align;
  badge?: Badge;
  breadcrumbs?: BreadcrumbItemType[];
  gradient?: Gradient;
  media?: Media;
  stats?: StatItem[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/* ===== helpers ===== */
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const GRADIENT_DEFAULT: Required<Gradient> = {
  from: "#203b8a",
  via: "#2a4db3",
  to: "#3560dc",
  direction: "to right",
  overlayOpacity: 0.65,
};
const MEDIA_DEFAULT: Required<Pick<Media, "objectPosition" | "dimOpacity">> & Pick<Media, "imageUrl" | "alt"> = {
  imageUrl: undefined,
  alt: "Background",
  objectPosition: "center",
  dimOpacity: 0.25,
};

export function PageHero(props: PageHeroProps) {
  const {
    title,
    description,
    size = "lg",
    align = "center",
    badge,
    breadcrumbs,
    gradient,
    media,
    stats,
    actions,
    children,
    className,
  } = props;

  const g = { ...GRADIENT_DEFAULT, ...(gradient ?? {}) };
  const m = { ...MEDIA_DEFAULT, ...(media ?? {}) };

  const wrapperPad = { sm: "pt-4 sm:pt-6 lg:pt-8", md: "pt-6 sm:pt-8 lg:pt-12", lg: "pt-8 sm:pt-12 lg:pt-16" }[size];
  const blockMinH = { sm: "min-h-[200px] sm:min-h-[220px] lg:min-h-[260px]", md: "min-h-[240px] sm:min-h-[280px] lg:min-h-[320px]", lg: "min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]" }[size];
  const titleSize = { sm: "text-3xl sm:text-4xl lg:text-5xl", md: "text-4xl sm:text-5xl lg:text-6xl", lg: "text-5xl sm:text-6xl lg:text-7xl" }[size];
  const descSize  = { sm: "text-sm sm:text-base lg:text-lg", md: "text-base sm:text-lg lg:text-xl", lg: "text-base sm:text-xl lg:text-2xl" }[size];
  const alignCls  = align === "left" ? "text-left items-start" : "text-center items-center";

  const bgLinear = useMemo(
    () => `linear-gradient(${g.direction.replace("to-", "to ")}, ${g.from}, ${g.via}, ${g.to})`,
    [g.direction, g.from, g.via, g.to]
  );

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none"; // hindari placeholder bertulisan judul
  };

  const renderBadge = () => {
    if (!badge) return null;
    const base = "inline-flex items-center bg-white/25 backdrop-blur-sm rounded-full border border-white/20";
    return (
      <Fragment>
        <div className="hidden sm:flex justify-center">
          <div className={cn(base, "px-5 py-2.5")}>
            {"icon" in badge && badge.icon ? (
              <span className="mr-2 inline-flex">{badge.icon}</span>
            ) : "iconClass" in badge && badge.iconClass ? (
              <i className={cn(badge.iconClass, "mr-2")} />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            <span className="text-base font-medium">{badge.text}</span>
          </div>
        </div>
        <div className="block sm:hidden absolute top-4 right-4">
          <div className={cn(base, "px-3 py-1.5")}>
            {"icon" in badge && badge.icon ? (
              <span className="mr-1.5 inline-flex">{badge.icon}</span>
            ) : "iconClass" in badge && badge.iconClass ? (
              <i className={cn(badge.iconClass, "mr-1.5 text-xs")} />
            ) : (
              <Star className="mr-1.5 h-3 w-3" />
            )}
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
        </div>
      </Fragment>
    );
  };

  return (
    <section className={cn("w-full", wrapperPad, className)}>
      {/* {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-3 sm:mb-4">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
      )} */}

      <div
        className={cn("relative mx-4 sm:mx-6 lg:mx-8 mb-8 sm:mb-10 lg:mb-14 rounded-3xl overflow-hidden", blockMinH)}
        style={{ background: bgLinear }}
      >
        {m.imageUrl && (
          <img
            src={m.imageUrl}
            alt={m.alt ?? "Background"}
            onError={handleImgError}
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              m.objectPosition === "top" && "object-top",
              m.objectPosition === "bottom" && "object-bottom",
              m.objectPosition === "left" && "object-left",
              m.objectPosition === "right" && "object-right",
              m.objectPosition === "center" && "object-center"
            )}
            style={{ opacity: Math.min(Math.max(m.dimOpacity, 0), 1) }}
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${g.direction.replace("to-", "to ")},
              ${rgba(g.from, g.overlayOpacity)},
              ${rgba(g.to, g.overlayOpacity)}
            )`,
          }}
        />

        <div className="relative z-10 h-full flex justify-center text-white py-10 lg:py-14 px-4">
          <div className={cn("max-w-6xl w-full flex flex-col gap-6", align === "left" ? "items-start" : "items-center")}>
            {renderBadge()}

            <div className={cn("flex flex-col gap-3", alignCls, badge ? "mt-10 sm:mt-0" : "")}>
              <h1 className={cn("font-bold tracking-tight drop-shadow-sm", titleSize)}>{title}</h1>
              {description && (
                <p className={cn("opacity-95 leading-relaxed font-normal max-w-3xl", descSize)}>{description}</p>
              )}
            </div>

            {Array.isArray(stats) && stats.length > 0 && (
                <div className="w-full">
                    {/* sm+: panel shrink-to-content & center; mobile: full width */}
                    <div className="mx-auto w-full sm:w-fit bg-white/12 backdrop-blur-md rounded-2xl border border-white/20 p-4 sm:p-6">
                    {/* Pakai FLEX agar mudah auto-center & shape mengikuti konten */}
                    <div className="flex flex-wrap items-stretch justify-center gap-3 sm:gap-4">
                        {stats.map((s, i) => (
                        <div
                            key={i}
                            className="rounded-xl bg-white/10 border border-white/15 px-4 py-5 text-center
                                    w-[156px] sm:w-[184px]"
                        >
                            <div className="flex justify-center mb-2">
                            {s.icon ? (
                                <span className="inline-flex">{s.icon}</span>
                            ) : s.iconClass ? (
                                <i className={cn(s.iconClass)} />
                            ) : i === 0 ? (
                                <ShieldCheck className="h-5 w-5" />
                            ) : i === 1 ? (
                                <CheckCircle2 className="h-5 w-5" />
                            ) : i === 2 ? (
                                <Users className="h-5 w-5" />
                            ) : (
                                <KeyRound className="h-5 w-5" />
                            )}
                            </div>
                            <div className="text-2xl font-bold leading-none">{s.value}</div>
                            <div className="text-xs opacity-90 mt-1">{s.label}</div>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
            )}

            {actions && <div className={cn(align === "left" ? "self-start" : "self-center")}>{actions}</div>}

            {children && (
              <div className="w-full">
                <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                  {children}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// juga ekspor default agar impor `import PageHero ...` bekerja
export default PageHero;