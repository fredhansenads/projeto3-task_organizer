# Etapa 6 · Relatórios e validação

Abra [Relatórios no sistema local](http://127.0.0.1:3000/painel?tela=relatorios) após entrar com sua conta. O início do painel apresenta as tarefas realizadas da conta e os indicadores de materiais da escola selecionada.

| Consulta | O que cada linha representa | Data usada no filtro |
| --- | --- | --- |
| Entregas de materiais | Uma obrigação de um professor para uma solicitação. As versões permanecem no detalhe. | Prazo individual vigente |
| Tarefas realizadas | Uma tarefa da conta, atualmente concluída e fora do arquivo. | Conclusão atual |
| Histórico de tarefas | Uma criação, edição, conclusão, reabertura, restauração ou arquivamento da tarefa. | Momento da ação |

Escolha o tipo de relatório e ajuste o período, a busca e os filtros disponíveis. Os limites de data incluem o dia inteiro em São Paulo. A primeira coluna da tabela leva ao registro de origem.

Em materiais, **exigidos** é a soma de recebidos e pendentes. A taxa divide os recebidos pelos exigidos da seleção. Com três professores, um recebido, um pendente e um dispensado, a taxa é **1 de 2, ou 50%**. Se só houver dispensas, aparece **Não se aplica**. Um material conferido integra os recebidos. A pontualidade considera o prazo vigente na primeira entrega válida, mesmo após correções.

Use **Exportar CSV** para abrir a seleção em planilha. O arquivo usa UTF-8, ponto e vírgula e proteção contra fórmulas em campos de texto. **Imprimir / salvar PDF** abre o diálogo do navegador. A impressão e o CSV incluem identificação da escola, critérios, filtros, indicadores e detalhes. Os controles de navegação ficam fora da impressão.

## Evidências de aceite

Os testes usaram contas e escolas temporárias no Supabase local e a aplicação compilada. Os dados criados pelos testes foram removidos ao final.

| Critérios do projeto | Verificação executada | Resultado |
| --- | --- | --- |
| AC01–AC03 | Sair e entrar, persistir campos e checklist, concluir, reabrir e comparar prazos perto da meia-noite de São Paulo | Aprovado |
| AC04–AC09 | Solicitação coletiva para dez docentes com reenvio, recebimento individual, atraso original, revisão, dispensa, reativação e bloqueio da conferência sem material | Aprovado |
| AC10 | Isolamento entre escolas e contas, histórico pessoal invisível ao colega, download privado e vínculo desativado | Aprovado |
| AC11 | Comparar indicadores do painel com registros do relatório, filtrar por professor, conferir denominador zero, CSV e impressão. Uma obrigação com duas versões contou uma vez. A tarefa reaberta saiu das realizadas e permaneceu no histórico. | Aprovado |
| AC12 | Interromper o envio de uma tarefa no navegador. Verificar mensagem e campos preservados, ausência da gravação e sucesso ao repetir. Rejeitar arquivo inválido e bloquear download antes da confirmação. | Aprovado |
| AC13 | Inspecionar relatórios no computador e em tela de 390 px. Abrir menu por teclado, navegar com Tab e Enter, verificar o foco, o acesso à tabela e a ausência de rolagem horizontal da página. | Aprovado para os fluxos exercitados |
| AC14 | Salvar uma versão, seus metadados e o arquivo em uma cópia temporária. Remover os registros de teste, restaurar a cópia, comparar os campos e os bytes e verificar o acesso autenticado. | Aprovado para a amostra local. O ensaio completo no ambiente de produção pertence à etapa 8. |

A [prévia do relatório](previas/relatorio-etapa-6.jpg) mostra o cenário de teste. O nome fictício iniciado por `=` foi usado para verificar que a exportação o mantém como texto.

## Repetir no computador

Com as dependências instaladas e o Supabase local em execução:

```powershell
pnpm exec supabase migration up --local
pnpm build
pnpm start
```

Com a aplicação na porta 3000, rode em outro terminal:

```powershell
pnpm test
pnpm test:rotina
pnpm test:materiais
pnpm test:auth
pnpm test:relatorios
```

No Windows, os testes de navegador usam o Edge instalado. Para uma instalação nova, siga o [guia da estrutura local](etapa-3-estrutura.md). O teste de autenticação inclui a restauração da amostra de arquivo. O teste de relatórios confere também que o navegador gera um PDF da seleção filtrada.
