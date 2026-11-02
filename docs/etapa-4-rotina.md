# Etapa 4 · Tarefas e agenda

Entre em [Minha Rotina Escolar](http://127.0.0.1:3000) com a conta de demonstração indicada no [guia de configuração](etapa-3-estrutura.md). O painel mostra tarefas de hoje, atrasos e próximos compromissos da escola selecionada.

## Avaliar uma tarefa

1. Em **Minhas tarefas**, escolha **Nova tarefa**. Informe o título e selecione área, prioridade e situação. Para associar uma turma, escolha primeiro o ano letivo. Descrição, observações, disciplina, etapas e prazo são opcionais.
2. Salve e abra a tarefa. Em **Editar tarefa e etapas**, marque os itens feitos e salve. Ao alterar um prazo, o histórico mostra o prazo anterior e o novo.
3. Use **Marcar como realizada**. Você pode anotar o que foi feito. Se houver etapas abertas, confirme expressamente que devem continuar pendentes. A data e a hora da conclusão ficam registradas.
4. Abra **Realizadas** e consulte a tarefa. **Reabrir tarefa** devolve a atividade para **A fazer** e conserva a conclusão anterior no histórico.
5. Para tirar uma atividade das consultas e da agenda, abra **Arquivamento**. Ela permanece em **Arquivadas**, onde pode ser restaurada.

A busca considera título, descrição e observações. Os filtros incluem área, situação, prioridade, ano, turma e disciplina. Na lista de realizadas, o intervalo de datas usa a conclusão atual. Nas outras listas usa o prazo.

## Avaliar a agenda

Abra **Agenda** e cadastre um compromisso com início e término. Alterne entre semana e mês, navegue pelos períodos ou escolha uma data. Um compromisso que atravessa a meia-noite aparece nos dois dias. Selecione o compromisso para consultar ou editar.

Cada tarefa com prazo aparece na agenda e abre o seu registro de origem. Alterar o prazo muda o dia em que ela aparece. Horários seguem **America/Sao_Paulo**. Um prazo só com data permanece em dia até a meia-noite que encerra aquela data.

## Executar e verificar

Para atualizar a instalação local da etapa 3, mantenha o Docker em execução e use:

```powershell
pnpm install --frozen-lockfile
pnpm exec supabase migration up --local
node scripts/setup-local.mjs
pnpm dev
```

O script prepara ano letivo, turma e disciplina de exemplo na escola fictícia. As contas consultam somente suas próprias tarefas e compromissos. Uma tentativa de salvar uma edição antiga pede para atualizar a página. Falhas na gravação de uma etapa desfazem a alteração inteira no banco.

Com a aplicação local na porta 3000, execute `pnpm test`, `pnpm build` e `pnpm test:rotina`. O último comando usa uma escola temporária e um navegador real. No Windows, utiliza o Microsoft Edge. Nos demais sistemas, instale o navegador do Playwright com `pnpm exec playwright install chromium`. Para verificar também o login e a recuperação de senha, execute `pnpm test:auth`.

Os prazos de materiais dos professores serão integrados com o módulo de entregas na etapa 5.
