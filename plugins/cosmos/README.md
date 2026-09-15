# Cosmos — versão mínima local

Plugin com duas skills automaticamente descobríveis e seis perfis de especialistas internos. Usa as ferramentas nativas de subagentes disponíveis na sessão. Não possui MCP, hooks, processo persistente, automação do ChatGPT Web ou ponte de sessões.

## Usar sem instalar

Abra o projeto em que deseja trabalhar, selecione **gpt-5.6-sol / low** e peça ao Codex:

> Leia a skill no caminho absoluto `<pasta-do-plugin>/skills/cosmos-orchestrate/SKILL.md` e use esse fluxo para [pedido].

Substitua o caminho pelo local onde este pacote foi salvo. A leitura explícita permite usar as instruções sem registrar o plugin. A skill não altera o modelo da conversa; selecione-o no app. Os especialistas podem receber modelo e esforço explicitamente quando a ferramenta nativa permitir. Se houver limitação, o agente deve informar o desvio e trabalhar diretamente.

Após a instalação e o início de uma nova sessão, você pode invocar o fluxo por `@Cosmos` ou `$cosmos:cosmos-orchestrate`, quando essas formas estiverem disponíveis na superfície do Codex usada. A skill também pode ser descoberta automaticamente quando o pedido menciona o Cosmos ou pede explicitamente o fluxo Cosmos. Pedidos comuns de desenvolvimento ou uso de subagentes não são gatilhos pretendidos; essa fronteira deve ser confirmada pela matriz de ativação em `VALIDATION.md`. Os nomes e a sintaxe exibidos podem variar entre superfícies e versões, portanto use a opção visível no seu ambiente. O registro em marketplace e a instalação são configurações locais de cada usuário e não fazem parte deste repositório.

Para trabalhar diretamente com commits, branches, push, pull requests, merge
requests ou CI, invoque `$cosmos:git-master`. Essa skill também pode ser
descoberta automaticamente por pedidos do domínio. Ela prepara trabalho sem
presumir autorização: commit, push, mutação de PR/MR e retry de CI são efeitos
separados. Merge, aprovação, auto-merge, tags, releases e exclusão de branches
ficam fora do seu escopo.

Os arquivos de interface usam nomes intencionalmente diferentes. Os prompts
do manifesto do plugin usam `$cosmos:cosmos-orchestrate`, pois `cosmos` é o
namespace do componente instalado; o atalho Git usa `$cosmos:git-master`. Cada
`agents/openai.yaml` usa o nome local declarado pela própria skill:
`$cosmos-orchestrate` ou `$git-master`. Testes separados protegem esses contratos.

## Perfis opcionais

Os seis TOMLs ficam em `skills/cosmos-orchestrate/references/agents/`. São papéis internos da skill e templates opcionais de agentes personalizados: não aparecem no seletor `@`, e estar dentro do plugin não os registra no Codex. O agente principal da conversa, com a skill carregada, exerce o papel de Orchestrator usando o modelo selecionado no chat; **gpt-5.6-sol / low** é a configuração recomendada, não uma troca automática de modelo.

| Papel | Modelo | Esforço |
|---|---|---|
| Oracle | gpt-6-astra | low |
| Librarian | gpt-5.6-luna | medium |
| Explorer | gpt-5.6-luna | medium |
| Designer | gpt-5.6-terra | medium |
| Executor | gpt-5.6-terra | medium |
| Git Master | gpt-5.6-terra | medium |

A documentação oficial oferece `.codex/agents/` para perfis por projeto e `~/.codex/agents/` para perfis pessoais. Se desejar os nomes registrados, uma etapa posterior autorizada pode copiar os TOMLs para o projeto escolhido, depois de verificar colisões por nome e arquivo. Este pacote não contém instalador nem modifica esses destinos. O prefixo `cosmos-` evita substituir o agente nativo `explorer` por acidente.

Perfis fixos podem prevalecer sobre modelo/esforço passados na criação. A skill orienta usar criação genérica com instruções do papel quando uma elevação de esforço for necessária. Permissões de leitura nos perfis são defaults; overrides da sessão podem prevalecer. As instruções de somente leitura continuam fazendo parte do contrato, sem promessa de isolamento rígido.

## Comportamento

- Skill carregada: o Cosmos está ativo; ele não deve alegar que não há skill vinculada ou acionável.
- Primeira atualização: declarar “Cosmos está ativo” e dizer se seguirá diretamente ou delegará.
- Pedido pequeno: execução direta, sem abrir uma equipe nem exigir subagente.
- Trabalho desconhecido: Explorer ou Librarian devolve contexto delimitado.
- Implementação: Executor e/ou Designer, com um responsável por arquivo.
- Git, PR/MR ou CI substancial: Git Master recebe o caminho da skill irmã e as autorizações exatas do pedido.
- Toda delegação transmite ações autorizadas, restrições e efeitos ainda sujeitos à aprovação; decisões adicionais voltam ao Orchestrator.
- Revisão: proporcional; Oracle apenas para decisões difíceis, diagnóstico persistente ou risco relevante. Uma revisão independente rotineira pode usar um Executor novo, sem edição.
- Falha de modelo ou ferramenta: registrar a capacidade auxiliar indisponível, evitar tentativas idênticas e assumir o trabalho quando possível. Não confundir falta de delegação nativa com ausência da skill nem substituir silenciosamente a distribuição.

## Verificação e limites

A versão publicada aparece nas tags e releases do repositório. O anexo
`cosmos-X.Y.Z.zip` contém o manifesto com essa versão; a cópia na `main` é
sincronizada por um PR automático após a publicação. Consulte
[guia de releases](https://github.com/anderson-spider/cosmos-codex-plugin/blob/main/RELEASING.md)
para o fluxo e os limites de atualização.

Consulte `VALIDATION.md` para a evidência desta versão. O pacote foi inspirado na divisão de papéis do [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim); as instruções foram escritas para Codex, sem copiar o runtime do OpenCode.

Fontes verificadas em 14/09/2026:

- [Subagentes e perfis TOML](https://learn.chatgpt.com/docs/agent-configuration/subagents).
- [Plugins](https://learn.chatgpt.com/docs/plugins).
- [Uso e limites do Codex](https://learn.chatgpt.com/docs/pricing).

## Comparar quota, tempo e retrabalho

Faça pares de tarefas equivalentes a partir do mesmo estado inicial: uma execução direta com Sol low e outra com esta skill. Use tarefas pequenas, uma mudança em vários arquivos e um diagnóstico; alterne a ordem das execuções. Não rode outros trabalhos na conta durante cada medição, se quiser atribuir a diferença ao teste.

Registre modelo/esforço efetivos, horário inicial/final, quota de cinco horas e semanal antes/depois (incluindo horário de reset), agentes acionados, testes aprovados, correções posteriores e defeitos encontrados na revisão. Descarte comparações atravessando reset ou misturadas com outras tarefas da conta. O percentual exibido pode ser arredondado; diferenças muito pequenas são inconclusivas.

Tokens reportados por ferramentas não equivalem diretamente a percentual da assinatura. Compare **quota por tarefa concluída com qualidade equivalente**, junto com tempo e retrabalho, ao longo de vários pares. Um exemplo sintético demonstra funcionamento, não economia. Não há percentual de economia medido ou prometido nesta versão.
