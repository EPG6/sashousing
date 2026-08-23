import Link from 'next/link';

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

function MailIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

export default function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-sas-line bg-sas-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-sas-black/65">
                    &copy; {year} Scripps Associated Students
                </p>
                <div className="flex flex-row items-center gap-5 text-sm sm:gap-6">
                    <Link
                        href="https://www.instagram.com/scripps_sas/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Scripps Associated Students on Instagram"
                        title="Instagram"
                        className="inline-flex items-center gap-2 font-medium text-sas-green hover:text-sas-black"
                    >
                        <InstagramIcon className="h-5 w-5 shrink-0" />
                    </Link>
                    <a
                        href="mailto:sas@scrippscollege.edu"
                        aria-label="Email Scripps Associated Students"
                        title="Email"
                        className="inline-flex items-center gap-2 font-medium text-sas-green hover:text-sas-black"
                    >
                        <MailIcon className="h-5 w-5 shrink-0" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
