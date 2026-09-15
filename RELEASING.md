# Releases do Cosmos

## Fluxo

1. O autor usa Conventional Commits e um título semântico no PR.
2. A CI valida os commits, o título e os testes.
3. Um mantenedor abre **Actions → Release → Run workflow** na `main`.
4. O workflow testa o código e executa Semantic Release. Commits `fix`/`perf`
   geram patch, `feat` gera minor e mudanças incompatíveis geram major. Sem
   commits relevantes, não há release.
5. Na fase `prepare`, a versão calculada é gravada no manifesto de origem e no
   pacote `cosmos-X.Y.Z.zip`. O pacote preserva o layout do marketplace,
   incluindo `.agents/plugins/marketplace.json`.
6. `@semantic-release/git` cria e envia o commit `chore(release)` com o
   manifesto. Em seguida, Semantic Release cria a tag apontando para esse commit
   e publica a release com notas e o pacote.

O disparo é exclusivamente manual e não há publicação no npm. A atualização do
manifesto ocorre antes da tag porque essa é a ordem do ciclo `prepare` do
Semantic Release; assim, a tag, o código fonte e o ZIP registram a mesma versão.
O workflow serializa publicações e processa a `main` mais recente. O commit
`chore(release)` não gera outro incremento.

## Primeira release

O repositório tinha `0.1.0` no manifesto, mas nenhuma tag SemVer ao introduzir
esta automação. Por padrão, o primeiro lançamento do Semantic Release será
`1.0.0`. O histórico antigo permanece intacto; ele não precisa ser convertido.
Depois disso, as tags publicadas são a referência do cálculo de versão.

## Configuração do GitHub

GitHub Actions precisa estar habilitado. O workflow usa `GITHUB_TOKEN`, com
`contents: write` para o commit, a tag e a release. Não é necessário criar um
PAT, desde que as regras da `main` permitam esse push do GitHub Actions. Se a
proteção da branch bloquear o commit automático, a execução falhará antes da
tag e a regra ou o ator autorizado precisará ser ajustado.

Em **Settings → Rules → Rulesets**, faça o check `Validate` ser obrigatório
para PRs na `main` e exija a branch atualizada. Prefira squash com o título
do PR; preserve o tipo semântico e o indicador de incompatibilidade ao editar
a mensagem final. Esses ajustes administrativos não são aplicados pelos
arquivos do workflow.

## Recuperação

Corrija a permissão ou falha encontrada e execute novamente o workflow manual.
O Semantic Release verifica as tags existentes e não publica novamente uma
versão concluída.

Uma falha entre a criação da tag e a publicação no GitHub exige inspeção:
Semantic Release pode considerar a tag já lançada numa nova execução. Não
apague ou mova tags automaticamente. Verifique os logs, o commit da tag e os
assets existentes antes de recuperar manualmente a release incompleta.

## Evidências e referências

Os testes locais usam o analyzer e o Commitlint reais, arquivos temporários e
APIs simuladas. Eles não executam uma publicação remota. O primeiro merge é
necessário para validar a publicação completa com o token do GitHub Actions.

- [Configuração do Semantic Release](https://semantic-release.gitbook.io/semantic-release/usage/configuration)
- [Publicação no GitHub e permissões](https://github.com/semantic-release/github)
- [Commitlint na CI](https://commitlint.js.org/guides/ci-setup.html)
