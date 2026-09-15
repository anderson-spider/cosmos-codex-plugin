# Validação — 15/09/2026

## Estrutura e compatibilidade

- Scaffold gerado pela skill plugin-creator; manifesto `.codex-plugin/plugin.json` aprovado por `validate_plugin.py`.
- Skill aprovada por `quick_validate.py`; política YAML de invocação explícita configurada.
- Cinco arquivos TOML de especialistas analisados com `tomllib` do Python; campos obrigatórios presentes.
- Modelos e esforços conferidos no catálogo embarcado do **codex-cli 0.154.0**. Isso valida os identificadores, não acesso universal de qualquer conta.
- Schema gerado pelo próprio CLI: `PluginDetail` contém skills, MCPs, hooks e outros componentes, mas nenhum campo de registro de agentes. O manifesto usa somente a skill; não promete instalar perfis.
- A documentação oficial descreve perfis por projeto em `.codex/agents/`. Uma inspeção com `codex debug prompt-input` em diretório isolado não exibiu os nomes dos perfis; portanto, não foi usada como prova de descoberta ou carregamento. `--strict-config` não é aceito nesse comando de diagnóstico.
- **Registro/seleção dos perfis TOML por nome e instalação no app não foram validados em execução.** O fluxo demonstrado usa ferramentas nativas de criação genérica, com modelo/esforço explícitos e instruções do papel.

## Reproduzir os validadores de autoria

Com as skills de sistema plugin-creator e skill-creator disponíveis, execute seus scripts `validate_plugin.py <pasta-do-plugin>` e `quick_validate.py <pasta-do-plugin>/skills/cosmos-orchestrate`. Nesta sessão foi usado Python com PyYAML em ambiente virtual isolado, sem instalar dependências globais.

Os arquivos da demonstração são fornecidos separadamente em `../../demo-cosmos/`. Execute `python3 -m unittest discover -s ../../demo-cosmos -v` a partir desta pasta. A demonstração é sintética e usa somente a biblioteca padrão Python; não acessa produção.

## Limites da evidência

Marketplace, instalação e configuração global não fazem parte dos arquivos versionados. Arquivos de teste de descoberta ficaram em uma pasta de trabalho isolada. Não se mediu variação de quota, consumo agregado, latência comparativa ou retrabalho em produção; os resultados não demonstram economia.

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

O repositório passa a usar Semantic Release para calcular versões, notas e tags,
com Commitlint na CI para commits e títulos de PR. O pacote gerado recebe a
versão no próprio manifesto; a sincronização da fonte usa uma branch e um PR
separados. Não há escrita direta na `main`.

Validações locais desta implementação: `npm ci --ignore-scripts`, `npm test`,
`python3 -m unittest discover -s demo-cosmos -v`, os dois validadores de autoria
e `actionlint` passaram. O pacote de exemplo `cosmos-1.0.0.zip` foi gerado,
extraído em diretório temporário e aprovado pelos validadores do plugin e skill.
Esse pacote é uma simulação local, não uma release publicada.

Os testes de integração dos commits usam as bibliotecas reais do analyzer e
Commitlint. Testes do pacote usam repositórios temporários, e os da sincronização
usam APIs simuladas, sem publicar no GitHub. A publicação completa com
`GITHUB_TOKEN` depende do primeiro merge; a abertura automática do PR também
depende da permissão administrativa descrita no guia de releases.
