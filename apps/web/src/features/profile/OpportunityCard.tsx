import { Heart } from "lucide-react";
import { Link } from "react-router";
import { useSaved } from "@/features/saved/use-saved";

type OpportunityCardProps = 
{
    title: string;
    organization: string;
    badge: string;
    date: string;
    // A category slug; unknown slugs get the neutral icon and badge.
    category: string;
    // Real opportunities link to their page and get a save heart; placeholders pass none.
    opportunityId?: string;
}

const icons: Record<string, string> =
{
    scholarship: "🎓",
    competition: "🏆",
    hackathon: "🏆",
    event: "📅",
    grant: "💰",
    job: "💼",
    internship: "💼",
}

export function OpportunityCard(props: OpportunityCardProps)
{
    return (
        <article className="opportunity-card">
            <div className={`opportunity-icon ${props.category}-icon`}>
                {icons[props.category] ?? "📌"}
            </div>
            <div className="opportunity-details">
                <p className="opportunity-organization">
                    {props.organization}
                </p>

                <h3 className="opportunity-title">
                    {props.opportunityId
                        ? <Link to={`/opportunities/${props.opportunityId}`}>{props.title}</Link>
                        : props.title}
                </h3>

                {props.badge && (
                <span className={`opportunity-badge ${props.category}`}>
                    {props.badge}
                </span>
                )}

                <p className="opportunity-date">
                {props.date}
                </p>
            </div>
            {props.opportunityId && <SaveHeart id={props.opportunityId} title={props.title} />}
        </article>
    )
}

function SaveHeart({ id, title }: { id: string; title: string })
{
    const { isSaved, toggle } = useSaved();
    const saved = isSaved(id);
    return (
        <button
            type="button"
            className="ml-auto self-start p-2"
            aria-pressed={saved}
            aria-label={saved ? `Unsave ${title}` : `Save ${title}`}
            onClick={() => toggle(id)}
        >
            <Heart className={saved ? "size-4 fill-current text-rose-600" : "size-4 text-muted-foreground"} />
        </button>
    )
}
