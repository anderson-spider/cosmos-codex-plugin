# Cosmos Codex Plugin

Cosmos adiciona ao Codex uma skill de orquestração seletiva, uma skill Git
Master e perfis para exploração, pesquisa, design, implementação, publicação e
decisões complexas.

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

Abra uma nova conversa após a instalação e invoque
`$cosmos:cosmos-orchestrate` ou `$cosmos:git-master`.
Consulte [`plugins/cosmos/README.md`](plugins/cosmos/README.md) para detalhes de
uso, perfis disponíveis, comportamento e limitações.

## Versões e releases

O workflow manual `Release` usa
[Semantic Release](https://semantic-release.gitbook.io/semantic-release/) para
publicar tags `vX.Y.Z`, notas e um pacote `cosmos-X.Y.Z.zip` a partir das
mudanças semânticas que chegaram à `main`. Consulte as
[releases](https://github.com/anderson-spider/cosmos-codex-plugin/releases)
para comparar versões. Durante a publicação, a versão é gravada no manifesto e
commitada automaticamente antes da criação da tag, de modo que a tag e o pacote
contenham a mesma versão.

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o padrão de commits e
[RELEASING.md](RELEASING.md) para configuração, recuperação e limites.
