import { Star } from "lucide-react"


function StarDisplay({ nota }: { nota: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`size-4 ${n <= nota ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                />
            ))}
        </div>
    );
}

export { StarDisplay }
