export default function Template({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-1 flex-col motion-safe:animate-page-in">
            {children}
        </div>
    );
}
