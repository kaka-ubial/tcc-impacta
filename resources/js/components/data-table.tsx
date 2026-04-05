import { ReactNode } from 'react';

interface Column<T> {
    label: string;
    render: (item: T) => ReactNode;
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
}

export function DataTable<T>({ data, columns }: Props<T>) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
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
                    {data.map((item, rowIndex) => (
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}