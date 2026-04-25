import { PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Column<T> {
    label: string;
    render: (item: T) => ReactNode;
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
}

export function DataTable<T>({ data, columns, loading = false, emptyMessage = 'Nenhum registro encontrado.' }: Props<T>) {
    return (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-left text-muted-foreground font-medium"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        Array.from({ length: 4 }, (_, rowIndex) => (
                            <tr key={rowIndex} className="border-t">
                                {columns.map((_, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3">
                                        <Skeleton className="h-4 w-full max-w-[180px]" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-16 text-center">
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <PackageOpen className="size-10 opacity-40" />
                                    <p className="text-sm">{emptyMessage}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-t hover:bg-muted/40 transition"
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3">
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
