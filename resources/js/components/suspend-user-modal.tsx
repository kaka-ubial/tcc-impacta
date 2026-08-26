import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import admin from '@/routes/admin';
import type { AdminUser } from '@/types/admin-user';

interface Props {
    user: AdminUser;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal de confirmação para suspender ou reativar um usuário. Espelha o
 * padrão de InstitutionModal (Dialog + useForm), mas o motivo é sempre
 * opcional — só faz sentido preenchê-lo ao suspender.
 */
export function SuspendUserModal({ user, isOpen, onClose }: Props) {
    const isSuspending = user.status !== 'suspenso';
    const targetStatus = isSuspending ? 'suspenso' : 'ativo';

    const { data, setData, patch, processing, reset } = useForm({
        status: targetStatus,
        motivo: '',
    });

    const closeModal = () => {
        reset();
        onClose();
    };

    const handleConfirm = () => {
        patch(admin.users.status(user.id).url, {
            onSuccess: closeModal,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isSuspending
                            ? 'Suspender usuário'
                            : 'Reativar usuário'}
                    </DialogTitle>
                    <DialogDescription>
                        {isSuspending
                            ? `Isso bloqueia o acesso de ${user.nome ?? user.email} e invalida suas sessões e tokens ativos.`
                            : `Isso restaura o acesso de ${user.nome ?? user.email} à plataforma.`}
                    </DialogDescription>
                </DialogHeader>

                {isSuspending && (
                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo (opcional)</Label>
                        <Textarea
                            id="motivo"
                            placeholder="Descreva o motivo da suspensão..."
                            value={data.motivo}
                            onChange={(e) => setData('motivo', e.target.value)}
                            rows={3}
                        />
                    </div>
                )}

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={closeModal}
                        disabled={processing}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant={isSuspending ? 'destructive' : 'default'}
                        className={
                            !isSuspending
                                ? 'bg-brand-green text-success-foreground hover:opacity-90'
                                : ''
                        }
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {isSuspending ? 'Suspender' : 'Reativar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
