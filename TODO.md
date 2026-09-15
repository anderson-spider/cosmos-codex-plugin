# Cosmos — melhorias priorizadas

## Critérios de prioridade

- **P0 — crítico:** bloqueia uso seguro, release ou funcionamento essencial.
- **P1 — alto:** reduz risco relevante e deve entrar na próxima evolução.
- **P2 — médio:** melhora robustez, manutenção e experiência de uso.
- **P3 — baixo:** refinamento incremental sem risco imediato.

## P0 — crítico

- [ ] Nenhum bloqueador crítico confirmado no estado atual.

## P1 — alto

- [x] Exigir que toda delegação informe as ações autorizadas, as restrições aplicáveis e quais efeitos ainda dependem de aprovação.
- [ ] Adicionar testes automatizados para os cinco perfis TOML: existência, parsing, campos obrigatórios, nomes, modelos, esforço e instruções.
- [ ] Validar na CI a coerência entre os perfis TOML, a tabela de papéis da skill e o README.
- [ ] Gerar o pacote real na CI, extrair o ZIP e executar os validadores de plugin e skill sobre o conteúdo distribuível.
- [ ] Criar uma matriz comportamental versionada para ativação por `@Cosmos`, invocação explícita, descoberta implícita, continuação e pedidos negativos.
- [ ] Executar e registrar um smoke test do plugin instalado em uma conversa nova do Codex.

## P2 — médio

- [ ] Definir o ciclo de vida dos subagentes quando o usuário interromper a tarefa, mudar o escopo ou concluir antecipadamente.
- [ ] Adicionar cenários de fallback para ferramenta de delegação ausente, modelo indisponível, seletor de agente inexistente e falha repetida.
- [ ] Verificar e documentar a diferença entre `$cosmos:cosmos-orchestrate` no manifesto e `$cosmos-orchestrate` em `agents/openai.yaml`.
- [ ] Validar o marketplace e o manifesto reais em conjunto: identidade, caminho da fonte, namespace e layout.
- [ ] Criar uma matriz de compatibilidade por superfície e versão, usando os estados `verificado`, `indisponível` e `não verificado`.
- [ ] Deixar explícito que `sandbox_mode = "read-only"` é uma configuração solicitada, não garantia contra overrides da sessão.
- [ ] Testar que o Orchestrator não conclui enquanto ainda houver trabalho necessário em subagentes ativos.

## P3 — baixo

- [ ] Ampliar o demo com conflitos de tipos aninhados: objeto versus escalar, objeto versus lista e dicionários vazios.
- [ ] Melhorar a documentação de preparação local, destacando `npm ci --ignore-scripts` antes de `npm test`.
- [ ] Avaliar um disparo seguro de CI para o PR automático de sincronização de versão, reduzindo intervenção manual após releases.
- [ ] Registrar data, versão do Codex e ambiente em cada execução da matriz comportamental.
- [ ] Medir quota, tempo e retrabalho apenas com pares de tarefas equivalentes e qualidade comparável.

## Definição de conclusão da próxima evolução

- [ ] Todos os itens P1 implementados e revisados.
- [ ] `npm test` aprovado após instalação das dependências.
- [ ] Testes Python do demo aprovados.
- [ ] Validadores de plugin e skill aprovados sobre o pacote gerado.
- [ ] `git diff --check` aprovado.
- [ ] Smoke test instalado registrado com limitações e evidências observadas.
