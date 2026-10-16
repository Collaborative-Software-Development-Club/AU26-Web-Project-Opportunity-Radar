type OpportunityCardProps = 
{
    title: string;
    organization: string;
    badge: string;
    date: string;
    category: "scholarship" | "competition" | "event" | "job";
}

export function OpportunityCard(props: OpportunityCardProps)
{
    const icons: Record<string, string> =
    {
        scholarship: "🎓",
        competition: "🏆",
        event: "📅",
        job: "💼"
    }

    return (
        <article className="opportunity-card">
            <div className={`opportunity-icon ${props.category}-icon`}>
                {icons[props.category]}
            </div>
            <div className="opportunity-details">
                <p className="opportunity-organization">
                    {props.organization}
                </p>

                <h3 className="opportunity-title">
                    {props.title}
                </h3>

                <span className={`opportunity-badge ${props.category}`}>
                    {props.badge}
                </span>

                <p className="opportunity-date">
                {props.date}
                </p>
            </div>
            
        </article>
    )
}