

import json
import os
import subprocess
import sys
import time

PRINCIPAIS = ("develop", "release", "main")


def escapar(valor: str) -> str:
    """Escapa valor de rotulo conforme o formato de exposicao do Prometheus."""
    return valor.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def buscar_execucoes(limite: int) -> list[dict]:
    campos = "name,headBranch,status,conclusion,createdAt,updatedAt"
    saida = subprocess.run(
        ["gh", "run", "list", "--limit", str(limite), "--json", campos],
        capture_output=True, text=True, check=True,
    ).stdout
    execucoes = json.loads(saida)
    if not execucoes:
        raise SystemExit("gh run list nao retornou execucoes")

    for e in execucoes:
        # cardinalidade sem limite e series orfas para sempre.
        e["branch"] = e["headBranch"] if e["headBranch"] in PRINCIPAIS else "feature"
    return execucoes


def para_epoch(iso: str) -> float:
    return time.mktime(time.strptime(iso, "%Y-%m-%dT%H:%M:%SZ"))


def metrica(nome: str, ajuda: str, tipo: str, amostras: list[str]) -> str:
    return "\n".join([f"# HELP {nome} {ajuda}", f"# TYPE {nome} {tipo}", *amostras, ""])


def main() -> None:
    limite = int(os.environ.get("LIMITE_EXECUCOES", "100"))
    destino = sys.argv[1] if len(sys.argv) > 1 else "github_actions.prom"

    execucoes = buscar_execucoes(limite)
    concluidas = [e for e in execucoes if e["status"] == "completed"]

    recentes: dict[tuple[str, str], dict] = {}
    for e in concluidas:
        chave = (e["name"], e["branch"])
        if chave not in recentes or e["createdAt"] > recentes[chave]["createdAt"]:
            recentes[chave] = e

    blocos = []

    blocos.append(metrica(
        "impacta_pipeline_duracao_segundos",
        "Duracao da ultima execucao concluida, por workflow e branch",
        "gauge",
        [
            f'impacta_pipeline_duracao_segundos{{workflow="{escapar(w)}",branch="{escapar(b)}"}} '
            f'{round(para_epoch(e["updatedAt"]) - para_epoch(e["createdAt"]))}'
            for (w, b), e in recentes.items()
        ],
    ))

    blocos.append(metrica(
        "impacta_pipeline_ultimo_resultado",
        "Resultado da ultima execucao: 1 sucesso, 0 falha",
        "gauge",
        [
            f'impacta_pipeline_ultimo_resultado{{workflow="{escapar(w)}",branch="{escapar(b)}"}} '
            f'{1 if e["conclusion"] == "success" else 0}'
            for (w, b), e in recentes.items()
        ],
    ))

    totais: dict[tuple[str, str, str], int] = {}
    for e in concluidas:
        chave = (e["name"], e["branch"], e["conclusion"] or "desconhecido")
        totais[chave] = totais.get(chave, 0) + 1

    blocos.append(metrica(
        "impacta_pipeline_execucoes",
        f"Execucoes concluidas nas ultimas {limite}, por resultado",
        "gauge",
        [
            f'impacta_pipeline_execucoes{{workflow="{escapar(w)}",branch="{escapar(b)}",'
            f'resultado="{escapar(r)}"}} {n}'
            for (w, b, r), n in totais.items()
        ],
    ))

    blocos.append(metrica(
        "impacta_pipeline_coleta_timestamp_segundos",
        "Momento da ultima coleta bem-sucedida",
        "gauge",
        [f"impacta_pipeline_coleta_timestamp_segundos {int(time.time())}"],
    ))

    conteudo = "\n".join(blocos)
    with open(destino, "w", encoding="utf-8", newline="\n") as arquivo:
        arquivo.write(conteudo)

    print(f"{len(recentes)} pares workflow x branch, {len(concluidas)} execucoes -> {destino}")


if __name__ == "__main__":
    main()
