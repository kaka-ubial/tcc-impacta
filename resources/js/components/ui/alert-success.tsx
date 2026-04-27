import { CheckCircle2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AlertSuccess({
    message,
    title,
}: {
    message: string;
    title?: string;
}) {
    return (
        <Alert className="border-success/20 bg-success/10 text-success [&>svg]:text-success">
            <CheckCircle2Icon />
            <AlertTitle>{title || 'Sucesso'}</AlertTitle>
            <AlertDescription className="text-success/80">{message}</AlertDescription>
        </Alert>
    );
}
