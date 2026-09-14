# Cosmos Codex Plugin

Cosmos adiciona ao Codex uma skill de orquestração seletiva com perfis para
exploração, pesquisa, design, implementação e decisões complexas.

## Instalação pelo marketplace

Adicione este repositório como marketplace usando a URL pública:

```text
https://github.com/anderson-spider/cosmos-codex-plugin
```

Depois, instale `cosmos@cosmos` pelo gerenciador de plugins. Pela CLI, o fluxo
equivalente é:

```bash
codex plugin marketplace add https://github.com/anderson-spider/cosmos-codex-plugin
codex plugin add cosmos@cosmos
```

Abra uma nova conversa após a instalação e invoque `$cosmos-orchestrate`.
Consulte [`plugins/cosmos/README.md`](plugins/cosmos/README.md) para detalhes de
uso, perfis disponíveis, comportamento e limitações.

## Versões e releases

O [Semantic Release](https://semantic-release.gitbook.io/semantic-release/)
publica tags `vX.Y.Z`, notas e um pacote `cosmos-X.Y.Z.zip` depois de mudanças
semânticas chegarem à `main`. Consulte as
[releases](https://github.com/anderson-spider/cosmos-codex-plugin/releases)
para comparar versões. O pacote anexado contém o manifesto atualizado.

A automação abre um PR `chore(release): sync plugin version X.Y.Z` para levar
essa versão ao manifesto da `main`. Faça o merge desse PR para que o marketplace
Git também apresente a nova versão. Esse commit não gera outra release.

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o padrão de commits e
[RELEASING.md](RELEASING.md) para configuração, recuperação e limites.
