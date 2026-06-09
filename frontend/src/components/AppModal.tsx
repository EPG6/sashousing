'use client';

import React from 'react';

type AppModalProps = {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    actions?: React.ReactNode;
};

const AppModal = ({
    isOpen,
    title,
    children,
    onClose,
    actions,
}: AppModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-sas-black/45 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-modal-title"
            onMouseDown={onClose}
        >
            <div
                className="w-full max-w-md rounded-md border border-sas-line bg-sas-white p-5 shadow-xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <h2
                        id="app-modal-title"
                        className="font-display text-xl font-semibold text-sas-black"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 text-2xl leading-none text-sas-black/55 hover:text-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                <div className="mt-3 text-sm leading-6 text-sas-black/70">
                    {children}
                </div>
                {actions && (
                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppModal;
