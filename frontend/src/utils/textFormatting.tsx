export function FormattedReviewText({
    text,
    className,
}: {
    text?: string;
    className?: string;
}) {
    if (!text) return null;

    return (
        <span className={className}>
            {text.split('\n').map((line, index) => (
                <span key={index}>
                    {line}
                    {index < text.split('\n').length - 1 && <br />}
                </span>
            ))}
        </span>
    );
}
