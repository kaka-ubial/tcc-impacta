import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Categoria = {
    id: number;
    nome: string;
};

function getInitialFormData(data?: any) {
    return {
        categoria_id: data?.categoria_id ?? null,
        descricao: data?.descricao ?? '',
        quantidade_objetivo: data?.quantidade_objetivo ?? null,
        prioridade: data?.prioridade ?? 'media',
    };
}

type FormData = {
    categoria_id: number | null;
    descricao: string;
    quantidade_objetivo: number | null;
    prioridade: 'baixa' | 'media' | 'alta';
};

export function NecessidadeCreateModal({ categorias, open, setOpen, initialData }: {
    categorias: Categoria[];
    open: boolean;
    setOpen: (v: boolean) => void;
    initialData?: any;
}) {    
    const isEdit = !!initialData?.id;

    const { data, setData, post, processing, put, reset, errors } = useForm<FormData>({
        ...getInitialFormData(initialData)
    });

    useEffect(() => {
        if (open) {
            setData(getInitialFormData(initialData));
        }
    }, [initialData, open]);

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (isEdit) {
            put(`/instituicao/necessidades/${initialData!.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                }
            });
        } else {
            post('/instituicao/necessidades', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Editar necessidade' : 'Criar necessidade'}
                    </DialogTitle>                
                </DialogHeader>

                <form onSubmit={submit} className="flex flex-col gap-4">

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Categoria</label>

                        <Select
                            value={data.categoria_id ? String(data.categoria_id) : ''}
                            onValueChange={(value) =>
                                setData('categoria_id', Number(value))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>

                            <SelectContent>
                                {categorias.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {errors.categoria_id && (
                            <span className="text-destructive text-xs">
                                {errors.categoria_id}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Descrição</label>

                        <Textarea
                            value={data.descricao}
                            onChange={(e) =>
                                setData('descricao', e.target.value)
                            }
                            placeholder="Descreva a necessidade..."
                            minLength={5}
                        />

                        {errors.descricao && (
                            <span className="text-destructive text-xs">
                                {errors.descricao}
                            </span>
                        )}
                        {!errors.descricao && data.descricao.length > 0 && data.descricao.length < 5 && (
                            <span className="text-destructive text-xs">
                                Descrição deve ter pelo menos 5 caracteres
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Quantidade objetivo</label>

                        <Input
                            type="number"
                            min={1}
                            value={data.quantidade_objetivo ?? ''}
                            onChange={(e) =>
                                setData(
                                    'quantidade_objetivo',
                                    e.target.value ? Number(e.target.value) : null
                                )
                            }
                            placeholder="Ex: 100"
                        />

                        {errors.quantidade_objetivo && (
                            <span className="text-destructive text-xs">
                                {errors.quantidade_objetivo}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm">Prioridade</label>

                        <Select
                            value={data.prioridade}
                            onValueChange={(value) =>
                                setData('prioridade', value as FormData['prioridade'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="baixa">Baixa</SelectItem>
                                <SelectItem value="media">Média</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing || !data.categoria_id || !data.quantidade_objetivo || data.descricao.length < 5}
                        >
                            {isEdit ? 'Editar' : 'Criar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}