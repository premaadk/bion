import { Link } from '@inertiajs/react';
import React from 'react';

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

interface BreadcrumbsProps {
    breadcrumbs: BreadcrumbItem[];
}

export const Breadcrumbs = ({ breadcrumbs = [] }: BreadcrumbsProps) => (
    <div className="text-sm text-neutral-500">
        {breadcrumbs.map((crumb, index) => (
            <span key={index}>
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (<Link href={crumb.href} className="hover:underline">{crumb.label}</Link>) : (<span>{crumb.label}</span>)}
            </span>
        ))}
    </div>
);