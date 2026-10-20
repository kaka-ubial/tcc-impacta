import { useForm } from '@inertiajs/react';
import { FileText, Pencil } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { update as updatePerfil } from '@/routes/instituicao/perfil';

const MAX_DESCRICAO = 2000;

export function PerfilSobreCard({ descricao }: { descricao: string | null }) {
    const [editando, setEditando] = useState(false);
    const {
        data,
        setData,
        setDefaults,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({ descricao: descricao ?? '' });

    function cancelar() {
        reset();
        clearErrors();
        setEditando(false);
    }

    function salvar(e: React.FormEvent) {
        e.preventDefault();
        patch(updatePerfil().url, {
            preserveScroll: true,
            onSuccess: () => {
                setDefaults();
                setEditando(false);
            },
        });
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    <FileText className="size-4" />
                    Sobre a instituição
                </CardTitle>
                {!editando && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => setEditando(true)}
                    >
                        <Pencil className="size-3.5" />
                        Editar
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {editando ? (
                    <form onSubmit={salvar} className="flex flex-col gap-2">
                        <Textarea
                            autoFocus
                            rows={6}
                            maxLength={MAX_DESCRICAO}
                            value={data.descricao}
                            onChange={(e) =>
                                setData('descricao', e.target.value)
                            }
                            placeholder="Conte quem vocês são, quem atendem e como as doações são usadas."
                            aria-label="Descrição da instituição"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                                {data.descricao.length}/{MAX_DESCRICAO}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelar}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    Salvar
                                </Button>
                            </div>
                        </div>
                        <InputError message={errors.descricao} />
                    </form>
                ) : descricao ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                        {descricao}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Você ainda não escreveu uma descrição. Instituições com
                        descrição passam mais confiança para quem vai doar.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
