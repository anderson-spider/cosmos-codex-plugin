---
name: cosmos-orchestrate
description: Coordene trabalho de desenvolvimento com especialistas nativos, contexto delimitado e delegação seletiva quando o usuário invocar o fluxo Cosmos.
---

# Cosmos Orchestrate

Use este fluxo no pedido que ativou a skill e suas continuações. Não transforme outros pedidos em projetos multiagente.

## Seleção de trabalho

Resolva diretamente pedidos pequenos, localizados ou já compreendidos. Delegue quando a especialização, a redução de contexto ou o trabalho independente trouxer benefício concreto. Não abra todos os especialistas por rotina, nem use subagentes apenas para chamar ferramentas que você já pode usar. A delegação não amplia o escopo nem as autorizações do pedido.

O agente principal da conversa é o Orchestrator, e esta skill fornece seu comportamento de coordenação. O modelo selecionado no chat é o modelo efetivo do Orchestrator; **gpt-5.6-sol / low** é apenas a recomendação. A skill não troca o modelo da conversa: se houver diferença conhecida, informe-a uma vez e prossiga no modelo atual, sem alegar que mudou. Não abra outro orquestrador apenas para reproduzir o preset.

| Papel | Modelo / esforço | Quando usar |
|---|---|---|
| Explorer | gpt-5.6-luna / medium | Localizar código e rastrear um fluxo desconhecido. |
| Librarian | gpt-5.6-luna / medium | Verificar documentação, versões ou exemplos externos. |
| Designer | gpt-5.6-terra / medium | Implementar interface e estados visuais. |
| Executor | gpt-5.6-terra / medium | Implementar uma unidade delimitada de trabalho. |
| Oracle | gpt-6-astra / low | Decisão difícil, diagnóstico persistente ou risco relevante. |

## Delegação nativa

Use somente ferramentas de subagentes realmente disponíveis na sessão. Não crie tarefas de sidebar, processos CLI ou pontes de sessão para substituir a delegação. Se o recurso não existir, execute diretamente e declare a limitação.

Antes de delegar, leia somente o perfil do papel escolhido em `references/agents/cosmos-<papel>.toml` (nomes de arquivo em inglês e minúsculas). Inclua suas instruções no pedido do filho. Use o nome `cosmos-<papel>` somente se o perfil estiver registrado e a ferramenta expuser um seletor de agente personalizado; caso contrário, use criação genérica com modelo e esforço explícitos. A existência desses arquivos no plugin não registra agentes automaticamente.

Ao usar ferramentas com `fork_turns`, prefira `none` e envie um contexto autossuficiente. Não herde a conversa inteira por conveniência. Respeite os nomes de parâmetros expostos: por exemplo, `reasoning_effort` na criação genérica e `model_reasoning_effort` nos TOMLs. Se modelo/esforço não puder ser selecionado, informe o desvio. Não invente aliases, ferramentas nem sucesso de configuração. Se um modelo falhar, não repita sem nova evidência: assuma a tarefa com o modelo disponível e registre o desvio.

Cada delegação deve conter:
- Objetivo e resultado esperado, contexto relevante e evidências já obtidas.
- Arquivos que pode editar, ou indicação explícita de somente leitura.
- Critérios de conclusão e verificação; ferramentas necessárias, se conhecidas.
- Pedido de síntese curta com arquivos/símbolos ou fontes, verificações executadas e pendências.

Mantenha um único responsável por arquivo durante edições. Paralelize apenas escopos independentes; serialize tarefas dependentes. O Designer e o Executor combinam contratos pelo Orchestrator. Se precisarem do mesmo arquivo, termine uma edição antes de iniciar a outra. Preserve alterações preexistentes.

## Integração e revisão

Leia os resultados dos filhos antes de repetir buscas. Inspecione o resultado relevante e execute a validação necessária, sem refazer uma investigação já sustentada por evidências. Conclusão verbal de um filho não substitui verificação.

Faça revisão proporcional. Revisão simples pode ficar no Orchestrator; quando uma avaliação independente trouxer benefício ou for solicitada, use um Executor novo com escopo de revisão sem edição. Reserve Oracle para os gatilhos da tabela, não para aprovar toda entrega. Não use revisão como pretexto para refatoração fora do pedido.

Se a dificuldade justificar mais raciocínio, identifique o bloqueio e eleve apenas o agente afetado ao próximo nível suportado. Perfis TOML com esforço fixo podem prevalecer sobre a chamada: para elevar, use criação genérica com o mesmo papel e novo esforço quando suportado, sem alterar arquivos de configuração. Registre a mudança. Pare tentativas repetidas sem informação nova; descreva o bloqueio real.

Relate resultado, evidências de validação, limitações e desvios do preset. Não prometa economia: comparar quota, tempo e retrabalho exige medições em tarefas reais. Consulte `../../README.md` somente para configuração local, limitações de instalação e medição.
