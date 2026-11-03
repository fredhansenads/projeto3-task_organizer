# Etapa 7 · Avaliação com o coordenador

**Etapa concluída.** O coordenador aprovou o piloto da Escola Horizonte.

Entre no [painel do piloto](http://127.0.0.1:3000/painel?escola=a6dfadd1-7183-47bc-8af1-000000000001) com a conta local de demonstração. As credenciais estão no arquivo privado `.env.demo.local`, na raiz do projeto. Se a entrada abrir em outra escola, selecione **Escola Horizonte · Piloto** no topo.

## Roteiro de avaliação

| O que experimentar | Resultado esperado |
| --- | --- |
| Em **Minhas tarefas**, abra **Preparar a atividade de frações** e marque como realizada. Consulte **Realizadas**. | A atividade de docência aparece com a data da conclusão. A tarefa da coordenação **Conferir os planos do 7º A** permanece aberta. |
| Em **Entregas**, abra **Ana Lima · Plano de avaliação do 7º A**. Registre o recebimento pelo canal que você costuma usar, informe a data real e marque como conferido. | O acompanhamento de Ana passa de pendente a recebido e conferido. |
| Abra a entrega de **Bruno Reis**. Leia a orientação da primeira versão, registre uma nova versão e confira o material. | A versão anterior mantém a orientação **Detalhar os critérios de correção**. A segunda versão tem sua própria conferência. |
| Em **Relatórios**, abra **Entregas de materiais** e compare os resultados. Na **Agenda**, localize a reunião de planejamento do 7º A. | No início, há **1 recebido de 2 exigidos (50%)**, nenhum conferido e um pendente. Após as duas conferências do roteiro, há **2 recebidos (100%)**, dois conferidos e nenhum pendente. |

Os exemplos são fictícios e podem ser alterados durante a avaliação. As datas são relativas à criação da escola-piloto. Para esta rodada, a referência é 03/11/2026, o prazo do material é 04/11/2026 e a reunião é 05/11/2026 às 14h, no horário de São Paulo.

## Aceite do coordenador

O coordenador encerrou a avaliação com a mensagem **“Piloto aprovado.”**

| Registro da rodada | Situação |
| --- | --- |
| Cenário local de coordenação e docência | Preparado em 03/11/2026 |
| Verificação técnica do cenário inicial | Acesso, duas tarefas, dois acompanhamentos e taxa de recebimento de 50% confirmados no navegador |
| Ajustes solicitados no retorno | Nenhum |
| Aceite do piloto | Aprovado pelo coordenador |

## Preparar em outra instalação local

Com a [estrutura local](etapa-3-estrutura.md) e as migrações atualizadas, execute `node scripts/setup-pilot.mjs` na raiz do projeto. O script usa o Supabase local, uma escola separada e a conta de demonstração. As operações têm identificadores estáveis para que uma nova execução possa retomar a preparação sem duplicar registros ou reiniciar a avaliação.
