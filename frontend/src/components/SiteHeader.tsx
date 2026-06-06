import Image from 'next/image';
import Link from 'next/link';

export default function SiteHeader() {
    return (
        <header className="border-b border-sas-line bg-sas-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Link
                    href="/campus/housing"
                    className="flex items-center gap-3 text-sas-black"
                >
                    <Image
                        src="/logos/saslogo.png"
                        alt="SAS"
                        width={56}
                        height={54}
                        priority
                        className="h-12 w-12 object-contain"
                    />
                    <span className="font-display text-2xl font-semibold leading-none">
                        Housing Reviews
                    </span>
                </Link>
                <span className="hidden text-sm uppercase text-sas-green sm:inline">
                    Student Affairs Senate
                </span>
            </div>
        </header>
    );
}
