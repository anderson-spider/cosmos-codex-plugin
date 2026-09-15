# Contribuir

## Commits e pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
nos commits e no título do PR:

```text
fix(orchestrate): preserve specialist context
feat(plugin): add a new specialist
docs: explain local installation
feat(plugin)!: replace the orchestration interface
```

O escopo entre parênteses é opcional. Use uma descrição curta e concreta em
inglês. Mudanças incompatíveis usam `!` ou um rodapé `BREAKING CHANGE: descrição`.

| Tipo | Efeito na próxima release |
| --- | --- |
| `fix:` | Patch, por exemplo `1.0.0` → `1.0.1` |
| `perf:` | Patch |
| `feat:` | Minor, por exemplo `1.0.0` → `1.1.0` |
| `!` ou `BREAKING CHANGE:` | Major, por exemplo `1.0.0` → `2.0.0` |
| `docs:`, `chore:`, `test:`, `ci:` e demais tipos aceitos | Sem release, salvo mudança incompatível |

O Semantic Release usa o maior incremento entre os commits ainda não publicados
quando um mantenedor executa manualmente o workflow `Release`. Não incremente
versões manualmente. Prefira **Squash and merge**, preservando o
título semântico do PR e eventuais rodapés de incompatibilidade. Merge normal
também funciona com commits semânticos; a mensagem automática de merge é ignorada.
Ao editar o título ou a mensagem final no GitHub, preserve o padrão.

O job `Validate` verifica título e commits introduzidos pelo PR. Alterações
manuais no número do manifesto exigem uma tag correspondente já existente e não
podem reduzir a versão da base. O commit de versão gerado pelo release é criado
diretamente pelo Semantic Release. Para tornar o check
obrigatório, configure uma regra de proteção da `main` com esse check e exigência
de branch atualizada. O workflow sozinho não impede um administrador de ignorar
uma falha. Não reescreva o histórico antigo para adequá-lo ao padrão.

## Validação local

Use Node.js 24.10 ou superior e Python 3.12:

```bash
npm ci --ignore-scripts
npm test
printf '%s\n' 'feat(plugin): add a new specialist' | npm run lint:commits
npm run lint:commits -- --from origin/main --to HEAD --verbose
python3 -m unittest discover -s demo-cosmos -v
```

Para alterações do plugin, execute também os validadores de autoria descritos
no `AGENTS.md`. As dependências Node pertencem apenas à automação deste
repositório; o plugin instalado não precisa de Node.js ou npm.
