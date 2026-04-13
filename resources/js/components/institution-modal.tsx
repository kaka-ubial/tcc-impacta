import { useForm } from '@inertiajs/react';
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


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl border border-border">
                <h2 className="text-xl font-bold mb-4">Detalhes da Instituição</h2>

                <div className="space-y-3 text-sm">
                    <p><strong>Razão Social:</strong> {institution.razao_social}</p>
                    <p><strong>CNPJ:</strong> {institution.cnpj}</p>
                    <p><strong>Endereço:</strong> {institution.endereco_completo}</p>
                    <p><strong>Telefone:</strong> {institution.telefone}</p>
                </div>

                <div className="mt-6">
                    <textarea
                        className="w-full rounded-md border px-3 py-2"
                        value={data.motivo}
                        onChange={e => setData('motivo', e.target.value)}
                    />
                </div>

                <div className="mt-6 flex justify-between ">
                    <button onClick={closeModal}>Cancelar</button>

                    <div className="flex gap-2">
                        <button
                            className="rounded-md bg-destructive px-4 py-2 text-sm text-white font-medium text-destructive-foreground hover:bg-destructive-90 disabled:opacity-70"
                            onClick={handleReject}
                            disabled={processing || data.motivo.length < 10}
                        >
                            Reprovar
                        </button>

                        <button
                            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-70"
                            onClick={handleApprove}
                            disabled={processing}
                        >
                            Aprovar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}