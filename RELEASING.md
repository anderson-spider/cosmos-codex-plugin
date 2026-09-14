# Releases do Cosmos

## Fluxo

1. O autor usa Conventional Commits e um título semântico no PR.
2. A CI valida os commits, o título e os testes.
3. Após o merge na `main`, o workflow `Release` testa o código e executa
   Semantic Release. Commits `fix`/`perf` geram patch, `feat` gera minor e
   mudanças incompatíveis geram major. Sem commits relevantes, não há release.
4. A versão calculada é gravada no manifesto de uma cópia do plugin dentro de
   `cosmos-X.Y.Z.zip`. O pacote preserva o layout do marketplace, incluindo
   `.agents/plugins/marketplace.json`. O arquivo de origem não é alterado.
5. Semantic Release cria a tag e publica a release com notas e o pacote.
6. A automação propõe a atualização do manifesto da `main` em um PR separado,
   usando a branch `automation/cosmos-vX.Y.Z`. O merge desse PR sincroniza a
   versão exibida por instalações que acompanham o marketplace Git.

Não há commit ou push automático para `main`. Não há publicação no npm.
As tags identificam o código fonte que gerou a release; o manifesto dentro dos
arquivos automáticos “Source code” do GitHub pode estar desatualizado. Para o
pacote com a versão calculada, use o anexo `cosmos-X.Y.Z.zip`.

O manifesto na `main` só acompanha a versão publicada após o merge do PR de
sincronização. Atualizações simultâneas podem ser agrupadas numa mesma release.
O workflow serializa publicações e processa a `main` mais recente. Uma atualização
de docs ou um commit `chore(release)` não dispara um novo incremento.

## Primeira release

O repositório tinha `0.1.0` no manifesto, mas nenhuma tag SemVer ao introduzir
esta automação. Por padrão, o primeiro lançamento do Semantic Release será
`1.0.0`. O histórico antigo permanece intacto; ele não precisa ser convertido.
Depois disso, as tags publicadas são a referência do cálculo de versão.

## Configuração do GitHub

GitHub Actions precisa estar habilitado. O workflow usa `GITHUB_TOKEN`, com
`contents: write` para tags/releases/branch de sincronização e
`pull-requests: write` para o PR. Não é necessário criar um PAT.

Em **Settings → Actions → General → Workflow permissions**, habilite
**Allow GitHub Actions to create and approve pull requests** para que o token
possa abrir o PR. Apesar do nome da opção, esta automação não aprova nem faz
merge de PRs. Se uma política da organização bloquear a opção, o administrador
precisa liberá-la. Sem ela, a release pode ser publicada e o passo de
sincronização falhar ao criar o PR.

Em **Settings → Rules → Rulesets**, faça o check `Validate` ser obrigatório
para PRs na `main` e exija a branch atualizada. Prefira squash com o título
do PR; preserve o tipo semântico e o indicador de incompatibilidade ao editar
a mensagem final. Esses ajustes administrativos não são aplicados pelos
arquivos do workflow.

PRs criados com `GITHUB_TOKEN` não disparam automaticamente os workflows de PR.
Feche e reabra o PR de sincronização com uma conta humana para disparar a CI
antes do merge. Não ignore checks obrigatórios para contornar essa limitação.

## Recuperação

O workflow também aceita execução manual na `main`. Uma nova execução verifica
a release mais recente e reaproveita a branch/PR de sincronização existente.
Se a release já existe e apenas a sincronização falhou, corrija a permissão e
execute novamente. Se um PR de versão antiga ficar obsoleto, revise e feche-o;
não faça merge de um manifesto que reduza a versão atual.

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
