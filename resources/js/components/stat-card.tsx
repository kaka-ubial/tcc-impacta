interface Props {
    title: string;
    value: string | number;
}

export function StatCard({ title, value }: Props) {
    return (
        <div className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-muted-foreground">
                {title}
            </p>

            <p className="mt-2 text-3xl font-bold">
                {value}
            </p>
        </div>
    );
}