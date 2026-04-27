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
import type { Instituicao } from '@/types/instituicao';

interface Props {
    institution: Instituicao;
    isOpen: boolean;
    onClose: () => void;
}

export function InstitutionModal({ institution, isOpen, onClose }: Props) {
    const { data, setData, post, processing, reset } = useForm({
        motivo: '',
    });

    const closeModal = () => {
        reset('motivo');
        onClose();
    };

    const handleApprove = () => {
        post(`/admin/institutions/${institution.usuario_id}/approve`, {
            onSuccess: closeModal,
        });
    };

    const handleReject = () => {
        post(`/admin/institutions/${institution.usuario_id}/reject`, {
            onSuccess: closeModal,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalhes da Instituição</DialogTitle>
                    <DialogDescription>
                        Revise as informações antes de aprovar ou reprovar o cadastro.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <p><strong>Razão Social:</strong> {institution.razao_social}</p>
                    <p><strong>CNPJ:</strong> {institution.cnpj}</p>
                    <p><strong>Endereço:</strong> {institution.endereco_completo}</p>
                    <p><strong>Telefone:</strong> {institution.telefone}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="motivo">
                        Motivo (obrigatório para reprovar, mín. 10 caracteres)
                    </Label>
                    <Textarea
                        id="motivo"
                        placeholder="Descreva o motivo da reprovação..."
                        value={data.motivo}
                        onChange={(e) => setData('motivo', e.target.value)}
                        rows={3}
                    />
                </div>

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={closeModal} disabled={processing}>
                        Cancelar
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || data.motivo.length < 10}
                        >
                            Reprovar
                        </Button>

                        <Button
                            className="bg-brand-green text-success-foreground hover:opacity-90"
                            onClick={handleApprove}
                            disabled={processing}
                        >
                            Aprovar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
