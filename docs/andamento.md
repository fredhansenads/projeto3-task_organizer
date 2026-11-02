# Andamento do projeto

Atualizado em 2 de novembro de 2026.

## Regra de continuidade

O usuário solicitou execução de uma etapa por vez e pergunta de autorização ao final de cada etapa. Aguardar resposta afirmativa antes de iniciar a próxima. A aprovação geral do projeto não autoriza avançar por todas as etapas de uma vez.

Em 30/10/2026, o usuário determinou que toda etapa concluída seja salva no Git e no GitHub. Após verificar a etapa e atualizar este registro, criar um commit, enviá-lo ao repositório `fredhansenads/projeto3-task_organizer` e confirmar a sincronização. Informar o commit na entrega e então pedir autorização para a próxima etapa. Não é necessária nova confirmação para esse commit e envio. Se houver falha, registrar a pendência e informar o usuário.

O commit `b82be96`, contendo a documentação e o protótipo da etapa 2, foi enviado à branch `main` do repositório.

## Situação

| Etapa | Entrega | Situação |
| --- | --- | --- |
| 1 | Definição final e documentação | Concluída e apresentada para avaliação |
| 2 | Protótipo visual | Concluída e apresentada para avaliação |
| 3 | Estrutura técnica | Concluída e testada em ambiente local |
| 4 | Tarefas e agenda | Concluída e testada em ambiente local |
| 5 | Entregas dos professores | Concluída e testada em ambiente local |
| 6 | Relatórios e validação | Concluída e testada em ambiente local |
| 7 | Projeto piloto | Não iniciada |
| 8 | Publicação e entrega | Não iniciada |

## Evidências da etapa 1

- Pasta de trabalho inspecionada: inicialmente vazia, sem repositório Git.
- Escopo aprovado consolidado em `projeto-sistema.md`.
- Regras de tarefas, entregas, datas, versões, dispensas e relatórios definidas.
- Tecnologias, entidades, controles de acesso e operação planejados.
- Oito etapas com entregas e quatorze cenários de aceite registrados.
- Documento Word gerado com oito páginas e todas as páginas revisadas visualmente. A renderização foi feita pelo Word instalado, pois o renderizador padrão não encontrou LibreOffice no ambiente.
- Estrutura do DOCX, presença das oito etapas e dos quatorze critérios verificadas. Os cenários da aplicação ainda não foram executados, pois a implementação pertence às próximas etapas.
- Nenhuma aplicação implementada, dependência do sistema instalada ou conta externa criada nesta etapa.

## Evidências da etapa 2

- Etapa autorizada pelo usuário com a mensagem “Pode Criar a etapa 2”.
- Protótipo local em `prototipo/index.html`, com estilos e comportamento em arquivos separados.
- Nove telas principais e diálogos de tarefas, entregas, professores e compromissos.
- Conclusão e reabertura testadas, incluindo confirmação de etapas pendentes e histórico.
- Recebimento, pedido de ajustes, segunda versão e conferência testados no navegador.
- Solicitação coletiva gerou seis acompanhamentos individuais na demonstração.
- Cadastro de professor e turma testados; turma duplicada rejeitada.
- Busca sem resultados e falha simulada de formulário verificadas, com campos preservados.
- Agenda em semana e mês; término anterior ao início rejeitado no formulário.
- Relatório filtrado e exportação CSV verificados; conteúdo do CSV conferido.
- Layout inspecionado no computador e em tela estreita; menu e recebimento verificados com teclado. Tabelas e calendário têm rolagem própria quando necessário.
- Sintaxe dos arquivos JavaScript verificada e ausência de erros de console observada nos fluxos testados.
- Guia de avaliação em `etapa-2-prototipo.md`. Captura do painel em `previas/painel-atual.jpg`.
- Sem banco, autenticação, envio de arquivos ou publicação na internet. Não foram iniciadas as etapas 3 a 8.

## Evidências da etapa 3

- Autorização recebida com a mensagem “Pode iniciar a 3 etapa”.
- Aplicação, dependências fixadas, migração PostgreSQL, política de anexos privados e modelo de e-mail de recuperação disponíveis no repositório.
- Compilação da aplicação com verificação de TypeScript aprovada.
- Migração executada em PostgreSQL em memória. Testados isolamento entre usuários, vínculo com a escola, histórico privado, restrições relacionais e acesso aos caminhos de anexos.
- Instruções para executar e repetir os testes em [Estrutura técnica](etapa-3-estrutura.md).
- Supabase local iniciado no Docker e migração aplicada. A aplicação compilada respondeu na porta 3000.
- Cadastro público rejeitado. Teste pelos formulários da aplicação confirmou entrada, painel com e sem vínculo, saída, entrega da mensagem no e-mail de teste e troca de senha. A senha antiga e a segunda tentativa de usar o mesmo link foram rejeitadas.
- Arquivo PDF fictício enviado e lido por usuário vinculado. O armazenamento rejeitou um tipo de arquivo incompatível e negou a leitura sem sessão ou após desativar o vínculo escolar.

## Evidências da etapa 4

- Migração aplicada ao Supabase local. O banco grava tarefa, checklist e histórico na mesma transação e verifica o proprietário e a escola nas alterações.
- No Edge, uma conta temporária criou uma tarefa com prazo, turma, disciplina e checklist. Os dados permaneceram após sair da conta e entrar novamente. Um formulário rejeitado manteve os campos preenchidos para nova tentativa.
- Conclusão com etapa pendente exigiu confirmação. O reenvio da conclusão preservou um único evento. A reabertura retirou a tarefa de Realizadas e preservou a anotação de conclusão no histórico.
- Busca, edição de prazo, arquivamento, restauração e retorno da agenda ao registro de origem verificados. Um compromisso atravessando a meia-noite apareceu nos dois dias. As visualizações semanal e mensal foram exercitadas.
- Testes de datas, integridade, falha parcial, isolamento, autenticação e recuperação aprovados. A compilação incluiu a verificação de TypeScript.
- [Guia de avaliação e execução](etapa-4-rotina.md).

## Evidências da etapa 5

- Cadastros de professores, anos, turmas, disciplinas e vínculos docentes disponíveis no painel. A inativação mantém as obrigações do professor.
- A solicitação para dez docentes gerou dez acompanhamentos. Repetir o comando preservou o total. A inclusão de um identificador inválido desfez a solicitação inteira.
- O teste no Edge criou uma solicitação, adicionou professor a outra, registrou material atrasado, pediu ajustes e conferiu a segunda versão. O PDF da primeira continuou disponível após recarregar a página.
- Prazo individual e mudança coletiva seletiva verificados. A primeira entrega permaneceu atrasada após a prorrogação. Dispensa e reativação alteraram apenas o acompanhamento selecionado.
- O servidor rejeitou arquivo com extensão incompatível com seu conteúdo. A API bloqueou a leitura de upload pendente e o download sem acesso. Um arquivo confirmado pôde ser baixado com o conteúdo original.
- O prazo na agenda abriu a entrega correspondente. Os testes anteriores de tarefas, agenda, recuperação de senha e isolamento também passaram.
- [Guia para avaliar o módulo](etapa-5-materiais.md).

## Evidências da etapa 6

- Indicadores do painel e relatórios ligados aos registros autorizados da escola. A consulta de histórico respeita as permissões de leitura de cada conta.
- CSV e impressão verificados na mesma seleção da tela. O teste incluiu um nome que poderia ser interpretado como fórmula e a geração de PDF pelo navegador.
- Comparação de contagens, filtros por professor, evento e período, acesso por teclado, uso em tela estreita e nova tentativa após falha de conexão aprovados.
- Testes anteriores de tarefas, materiais, autenticação e isolamento aprovados. Versão, metadados e arquivo foram restaurados em ensaio local com dados fictícios.
- [Guia e matriz de aceite](etapa-6-relatorios.md).

## Próxima decisão

Aguardar autorização para iniciar a etapa 7, o piloto com o coordenador e um pequeno conjunto de registros representativos.
