# Validação — 15/09/2026

## Estrutura e compatibilidade

- Scaffold gerado pela skill plugin-creator; manifesto `.codex-plugin/plugin.json` aprovado por `validate_plugin.py`.
- As duas skills foram aprovadas por `quick_validate.py`; descoberta automática mantida para ambas.
- Os prompts iniciais do manifesto usam os nomes instalados `$cosmos:cosmos-orchestrate` e `$cosmos:git-master`, respeitam o limite de três entradas e têm até 128 caracteres.
- Os arquivos `agents/openai.yaml` usam os nomes locais `$cosmos-orchestrate` e `$git-master`. Testes separados distinguem esses contratos dos namespaces instalados usados pelo manifesto.
- Seis arquivos TOML de especialistas analisados com `tomllib` do Python; campos obrigatórios presentes.
- Modelos e esforços conferidos no catálogo embarcado do **codex-cli 0.154.0**. Isso valida os identificadores, não acesso universal de qualquer conta.
- Schema gerado pelo próprio CLI: `PluginDetail` contém skills, MCPs, hooks e outros componentes, mas nenhum campo de registro de agentes. O manifesto usa somente a skill; não promete instalar perfis.
- A documentação oficial descreve perfis por projeto em `.codex/agents/`. Uma inspeção com `codex debug prompt-input` em diretório isolado não exibiu os nomes dos perfis; portanto, não foi usada como prova de descoberta ou carregamento. `--strict-config` não é aceito nesse comando de diagnóstico.
- **Registro/seleção dos perfis TOML por nome e instalação no app não foram validados em execução.** O fluxo demonstrado usa ferramentas nativas de criação genérica, com modelo/esforço explícitos e instruções do papel.
- O contrato de delegação exige transmitir ações autorizadas, restrições e efeitos ainda sujeitos à aprovação. Testes automatizados protegem esses limites, o retorno de decisões adicionais ao Orchestrator e o carregamento da skill irmã pelo Git Master.

## Git Master

- A skill pública cobre inspeção, preparação, commit, push, PR/MR e CI para GitHub e GitLab por referências carregadas progressivamente.
- Commit exige pedido de commit ou publicação. Push, mutação de PR/MR e retry, rerun ou cancelamento de CI permanecem autorizações independentes.
- Merge, aprovação, auto-merge, tags, releases, exclusão de branches e force-push estão explicitamente fora do contrato.
- O perfil interno `cosmos-git-master` recomenda **gpt-5.6-terra / medium** e não é registrado automaticamente no seletor `@`.
- Uma varredura local do conteúdo novo não encontrou nomes, domínios ou contas privadas presentes nas skills usadas como origem. Os identificadores não foram gravados como fixtures ou regras no repositório público.
- A descoberta e a execução instaladas de `$cosmos:git-master` ainda dependem de uma futura release, reinstalação e sessão nova; esta entrega não remove as skills locais usadas como fallback.

## Reproduzir os validadores de autoria

Com as skills de sistema plugin-creator e skill-creator disponíveis, execute `validate_plugin.py <pasta-do-plugin>` e `quick_validate.py` para `skills/cosmos-orchestrate` e `skills/git-master`.

Os arquivos da demonstração são fornecidos separadamente em `../../demo-cosmos/`. Execute `python3 -m unittest discover -s ../../demo-cosmos -v` a partir desta pasta. A demonstração é sintética e usa somente a biblioteca padrão Python; não acessa produção.

## Limites da evidência

Marketplace, instalação e configuração global não fazem parte dos arquivos versionados. Arquivos de teste de descoberta ficaram em uma pasta de trabalho isolada. Não se mediu variação de quota, consumo agregado, latência comparativa ou retrabalho em produção; os resultados não demonstram economia.

A ativação por `@Cosmos` e a descoberta automática ainda precisam ser verificadas após reinstalar esta versão e iniciar uma conversa nova no app. A validação automatizada confirma o contrato do pacote, mas não substitui essa observação ponta a ponta.

## Matriz de ativação

Os testes automatizados verificam que os prompts iniciais invocam a skill instalada pelo namespace e que a metadata não desabilita descoberta automática. Após reinstalação, a avaliação no app deve registrar:

- `@Cosmos` seguido de uma tarefa pequena: Cosmos ativo e execução direta declarada.
- `$cosmos:cosmos-orchestrate` seguido de tarefa complexa: Cosmos ativo e delegação observável quando houver benefício.
- Menção textual ao fluxo Cosmos: descoberta automática da skill.
- Pedido comum de desenvolvimento ou subagentes, sem Cosmos: a skill não deve ser selecionada apenas por esses termos.
- Continuação do pedido ativado: o fluxo deve permanecer ativo.
- Pedido fora do escopo: nenhuma ativação ou ação não suportada.
- `$cosmos:git-master` seguido de pedido de preparação: nenhuma mutação local ou remota sem a autorização correspondente.
- Pedido comum de Git, PR/MR ou CI: descoberta automática do Git Master quando aplicável.
- Delegação de fluxo Git substancial pelo Orchestrator: perfil `cosmos-git-master`, skill irmã carregada e limites de autorização preservados.

## Demonstração executada

O agente principal da conversa atuou como Orchestrator com `gpt-5.6-sol / low`, contexto novo e a skill como entrada; não foi usado um perfil de Orchestrator registrado. Ele criou sequencialmente Explorer (`gpt-5.6-luna / medium`), Executor (`gpt-5.6-terra / medium`) e um Executor novo para revisão independente (`gpt-5.6-terra / medium`). Os modelos/esforços foram passados explicitamente nas chamadas nativas. Oracle, Librarian e Designer não foram acionados.

Pedido: corrigir uma função de combinação de configurações JSON. O Explorer identificou merge raso, descarte de valores falsy e compartilhamento de mutáveis. O Executor alterou somente a função e seus testes. O revisor não encontrou defeitos materiais e verificou casos adicionais em memória. O teste original passa mesmo no código defeituoso; a suíte expandida cobre o comportamento solicitado.

Resultado: **5 testes aprovados**, cobrindo override básico, merge recursivo/preservação, valores falsy/None, substituição de listas e isolamento de estruturas das duas entradas. A função anterior foi preservada em `settings.before.txt` para comparação. O fluxo de três etapas foi solicitado explicitamente para demonstração; num pedido desse tamanho, o comportamento padrão da skill seria resolver diretamente. Não houve falha de modelo ou delegação.

## Revisão estática independente da skill

Executor/Terra medium avaliou a seleção de agentes e os casos de pedido pequeno, ferramenta ausente, modelo indisponível, edições concorrentes e elevação de esforço. Encontrou uma condição incompleta na seleção de perfis por nome. A skill foi corrigida para exigir também que a ferramenta exponha esse seletor; ferramentas como a desta sessão usam criação genérica. Essas situações foram analisadas estaticamente, não executadas como testes ponta a ponta.

Controle de regressão: a suíte expandida foi executada em memória contra a função anterior; **2 testes falharam e 1 terminou em KeyError**, pois o merge raso descartava uma chave necessária. Na versão corrigida, os 5 testes passam.

Um relato real mostrou o Orchestrator dizendo que o Cosmos “não expôs uma skill ou ferramenta acionável” enquanto `cosmos-orchestrate` já estava carregada. O contrato agora separa três estados: skill ativa, decisão de executar diretamente e indisponibilidade da delegação nativa. A revisão estática confirmou que somente o terceiro estado deve ser relatado como limitação; executar diretamente continua sendo comportamento do Cosmos.

## Renomeação para Cosmos

Marca, identificador do plugin, skill e nomes dos perfis atualizados para Cosmos. A demonstração funcional acima foi executada antes da renomeação; após a mudança foram repetidas as validações de estrutura e referências, sem alterar lógica ou modelos.

## Versionamento e Conventional Commits

O repositório usa Semantic Release para calcular versões, notas e tags, com
Commitlint na CI para commits e títulos de PR. O workflow de release é manual.
Na fase `prepare`, o pacote e o manifesto de origem recebem a versão calculada;
`@semantic-release/git` commita o manifesto antes da criação da tag.

Validações locais após a inclusão do Git Master: `npm test` (20 testes),
`python3 -m unittest discover -s demo-cosmos -v` (5 testes), `git diff --check`
e os três validadores de autoria passaram. Os seis perfis TOML também foram
carregados por `tomllib`. A configuração de release carregada anteriormente
também
confirmou a ordem `prepare-release` → `@semantic-release/git` →
`@semantic-release/github`. `actionlint` não está instalado neste worktree.

Na validação anterior do fluxo de release, o pacote de exemplo
`cosmos-1.0.0.zip` foi gerado, extraído em diretório temporário e aprovado pelos
validadores do plugin e skill. Esse pacote é uma simulação local, não uma release
publicada.

Os testes de integração dos commits usam as bibliotecas reais do analyzer e
Commitlint. Testes do pacote usam repositórios temporários, sem publicar no
GitHub. A publicação completa com `GITHUB_TOKEN` depende das permissões da
branch e só pode ser comprovada por uma execução manual após o merge.
