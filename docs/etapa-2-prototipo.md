# Avaliação do protótipo Minha Rotina Escolar

Etapa 2 entregue em 30 de outubro de 2026.

O protótipo permite avaliar a aparência, a navegação e os principais fluxos antes da implementação com banco de dados. A data de referência dos exemplos é 29 de outubro de 2026, independentemente da data do computador.

## Acesso

Abra `prototipo/index.html` em um navegador. Também é possível executar `node prototipo/serve.mjs` na raiz do projeto e acessar http://127.0.0.1:4173 enquanto o servidor estiver ligado.

O protótipo é local e não foi publicado na internet. A prévia usa dados fictícios da Escola Horizonte. Não é preciso informar senha ou cadastrar uma conta.

## O que avaliar

1. **Início:** confira tarefas de hoje, atrasos, entregas e agenda. Experimente as abas Hoje, Atrasadas e Próximas.
2. **Minhas tarefas:** use os filtros, crie uma tarefa, abra seus detalhes e conclua. A tarefa Revisar os planejamentos de novembro demonstra a confirmação quando existem etapas pendentes.
3. **Realizadas:** localize uma tarefa concluída e reabra. O histórico anterior continua disponível nos detalhes.
4. **Entregas dos professores:** selecione uma solicitação. Registre um recebimento para Carlos Oliveira. Depois abra os detalhes, peça ajustes, registre uma nova versão e marque como conferido.
5. **Ajustes já preenchidos:** a entrega de Mariana Costa contém um exemplo de material devolvido para correção, com prazo próprio.
6. **Nova solicitação:** informe o material e selecione professores. Cada professor selecionado recebe um acompanhamento independente.
7. **Professores:** cadastre um nome fictício, busque por nome ou disciplina e consulte suas entregas. Inativar preserva registros anteriores.
8. **Turmas e disciplinas:** acrescente um cadastro. Nomes já existentes são recusados.
9. **Agenda:** alterne entre mês e semana, avance os períodos e abra uma atividade. Crie um compromisso com horários válidos.
10. **Relatórios:** filtre por solicitação, compare os totais com as entregas e exporte um CSV. Imprimir usa o diálogo de impressão do navegador.
11. **Configurações:** teste uma alteração de escola ou nome de exibição. A opção de falha simulada permite avaliar uma mensagem de erro e repetir o salvamento sem perder os campos.

No celular, abra o menu pelo botão no canto superior esquerdo. Tabelas extensas e calendário mensal podem ser deslizados horizontalmente; a agenda semanal oferece uma alternativa mais compacta.

## Limites desta etapa

- Os registros existem apenas na memória da página. Recarregar ou usar Reiniciar demonstração restaura os exemplos.
- As datas e os eventos de histórico demonstram o dia 29/10/2026. A data real e o horário das operações serão integrados na aplicação.
- Arquivos selecionados não são enviados nem armazenados; apenas seus nomes ilustram o fluxo. Os arquivos já listados são referências fictícias, sem download.
- Links informados são exibidos como texto e não são acessados automaticamente.
- Não há login, contas de professores, integração com e-mail/WhatsApp, backups, banco de dados ou notificações reais.
- A impressão abre a interface do navegador. A exportação CSV foi verificada; ainda não houve validação de impressão em impressora física.
- Os testes desta etapa verificam o protótipo. Não substituem os testes de segurança, persistência e integração previstos para as próximas etapas.

## Verificações realizadas

| Fluxo | Evidência observada |
| --- | --- |
| Concluir com etapas abertas | Confirmação exibida antes da conclusão |
| Concluir e reabrir | Tarefa mudou de lista e histórico conservou ambas as ações |
| Receber e pedir ajustes | Situação individual atualizada sem alterar os outros professores |
| Registrar segunda versão | Duas versões e histórico de ajustes disponíveis |
| Conferir material | Registro e totais atualizados |
| Criar solicitação coletiva | Seis professores produziram seis linhas de acompanhamento |
| Busca vazia | Mensagem de ausência de resultados e ação para limpar filtros |
| Falha simulada | Erro explícito, título preenchido preservado e nova tentativa bem-sucedida |
| Cadastro duplicado | Turma existente recusada; nome diferente aceito |
| Compromisso inválido | Término anterior ao início recusado |
| Relatório filtrado | Contagens coerentes com as alterações realizadas no teste |
| CSV | Arquivo baixado e conteúdo conferido com filtro e registros |
| Tela estreita | Menu e formulário operáveis; página sem transbordamento horizontal observado |
| JavaScript | Sintaxe válida e nenhum erro de console nos fluxos inspecionados |

## Próxima etapa

A etapa 3 prepara a estrutura técnica com TypeScript, Next.js, PostgreSQL/Supabase, autenticação e controle de acesso. Ela só começará depois da autorização do usuário. Ajustes de aparência e navegação podem ser solicitados antes dessa aprovação.
