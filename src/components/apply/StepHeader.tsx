interface StepHeaderProps {
  /** Optional small eyebrow label above the heading */
  eyebrow?: string;
  /** Primary heading — rendered as h2 */
  title: string;
  /** Short muted supporting text */
  description?: string;
}

export default function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <div className="mb-7">
      {eyebrow && (
        <p className="text-xs font-semibold text-navy/60 uppercase tracking-widest mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
