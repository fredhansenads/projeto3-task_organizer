# Projeto do sistema Minha Rotina Escolar

Versão 1.0 • 29 de outubro de 2026

Este documento orienta a construção do sistema aprovado para organizar o trabalho de um coordenador escolar e professor. Define o escopo da primeira versão, as regras de funcionamento, a arquitetura proposta e as entregas que deverão ser avaliadas em cada etapa.

A primeira versão atenderá uma escola e uma conta de coordenador. Os professores serão cadastrados como pessoas acompanhadas, sem acesso próprio inicialmente. O sistema será acessado pela internet, no computador ou celular, com interface em português e dados persistentes.

## Escopo e condução do projeto

O produto deverá responder a quatro perguntas: o que preciso fazer, o que já realizei, quem precisa entregar materiais e quais entregas ainda precisam de conferência ou correção.

As áreas Coordenação, Docência e Pessoal organizarão as tarefas do usuário. Turmas, disciplinas e ano letivo contextualizarão os registros escolares. A troca de ano letivo preservará os históricos anteriores.

**Incluído na primeira versão**

- Login e recuperação de senha para o coordenador.
- Cadastro, filtros, etapas, conclusão, reabertura e histórico de tarefas.
- Cadastro de professores, turmas, disciplinas e seus vínculos por ano letivo.
- Solicitações de materiais para vários professores e acompanhamento individual.
- Recebimentos, conferências, ajustes, dispensas e anexos privados.
- Agenda de compromissos e prazos, painel diário e relatórios básicos.
- Exportação CSV e visualização de impressão para salvar em PDF pelo navegador.
- Controle de acesso, registros de alterações e procedimento de backup e restauração.

**Evoluções posteriores**

Portal dos professores, envio direto de materiais, recorrência de tarefas, projetos escolares, atas com geração de tarefas, lembretes automáticos, integração com Google Calendar e funcionamento sem internet. A primeira versão não terá cadastro individual de alunos.

**Regra de execução acordada**

Executar uma etapa por vez. Ao terminar, apresentar os arquivos ou telas, explicar o que foi verificado e perguntar ao usuário se pode continuar. A etapa seguinte só começa após resposta afirmativa. A aprovação geral do projeto não substitui essas autorizações. Correções da etapa em avaliação fazem parte dela.

O documento e a definição dos requisitos constituem a etapa 1. O próximo trabalho será o protótipo visual, ainda sem dados reais. Mudanças de escopo serão registradas aqui, com nova versão, antes de afetarem a implementação.

## Tarefas e registro de atividades realizadas

**RF01 Cadastro e organização**

Cada tarefa terá título obrigatório, área, prioridade, situação e responsável. Descrição, prazo, turma, disciplina, observações e lista de etapas serão opcionais. Prioridades: baixa, normal e alta. Situações: a fazer, em andamento, aguardando retorno e concluída.

O prazo poderá conter apenas data ou data e horário. Datas serão exibidas no padrão brasileiro. A referência local será America/Sao_Paulo. Sem horário informado, a tarefa vencerá ao final do dia local; sem prazo, não receberá aviso de atraso.

**RF02 Conclusão e reabertura**

O botão Concluir registrará data e hora automaticamente e moverá a tarefa para a consulta de realizadas. Será possível incluir observação de conclusão. Um clique repetido não poderá gerar conclusões duplicadas. Havendo etapas desmarcadas, o sistema pedirá uma decisão antes de concluir; não marcará essas etapas silenciosamente.

Reabrir retornará a tarefa para A fazer, retirando a conclusão atual e preservando o evento anterior no histórico. A tela de realizadas mostrará tarefas atualmente concluídas. O histórico detalhado continuará mostrando conclusões anteriores de tarefas reabertas.

**RF03 Filtros e histórico**

Filtrar por texto, área, situação, prioridade, turma, disciplina, ano letivo e período. O relatório de realizadas usará a data da conclusão atual. O relatório de eventos poderá consultar ações anteriores sem confundi-las com tarefas atualmente concluídas.

Atrasada será uma indicação calculada quando uma tarefa aberta tiver prazo vencido. Uma tarefa poderá estar em andamento e atrasada simultaneamente. Tarefas concluídas exibirão se a conclusão ocorreu depois do prazo.

**RF04 Alterações e arquivamento**

Editar título, prazo ou situação deverá registrar autor e horário. Mudanças de prazo preservarão o prazo anterior no histórico. Arquivar esconderá o registro das consultas padrão sem apagar seu histórico; será possível consultar e restaurar arquivados.

**Critérios de aceite da função**

- Criar uma tarefa, sair e entrar novamente deverá preservar todos os campos.
- Concluir deverá registrar um único evento e atualizar o painel de realizadas.
- Reabrir deverá preservar a conclusão anterior e retirar a tarefa da contagem atual de concluídas.
- O aviso de atraso deverá respeitar data, horário e fuso, inclusive perto da meia-noite.
- Uma atualização que falhar deverá informar o erro e não exibir sucesso falso.

## Materiais e entregas dos professores

**RF05 Solicitação coletiva com acompanhamento individual**

A solicitação terá título, tipo de material, orientações, ano letivo, período de referência e prazo obrigatório. Turma e disciplina serão opcionais. O coordenador selecionará os professores ativos envolvidos. Cada combinação de solicitação e professor terá um único acompanhamento. Se houver materiais diferentes por turma, serão criadas solicitações separadas.

Criar uma solicitação para dez professores deverá gerar dez acompanhamentos em uma única operação: todos serão gravados ou nenhum será. Repetir a operação não poderá gerar duplicações. Adicionar professores posteriormente será permitido com registro da alteração; os demais acompanhamentos serão preservados.

**RF06 Registro do recebimento**

Informar a data real da entrega, o canal de recebimento, observações e, opcionalmente, arquivo ou link. Canais: papel, e-mail, WhatsApp e outro. A data informada e o instante em que o usuário registrou o recebimento serão campos diferentes. Datas de recebimento futuras serão rejeitadas.

Anexar um arquivo será uma operação explícita. O sistema não acessará e-mail ou WhatsApp automaticamente. O envio será considerado completo somente depois de confirmado pelo armazenamento.

**RF07 Conferência e correções**

Recebimento: pendente, recebido ou dispensado. Conferência de material recebido: aguardando conferência, conferido ou precisa de ajustes. Não será possível conferir algo que ainda não foi recebido.

Ao solicitar ajustes, registrar orientação e prazo de correção. A nova versão manterá a entrega original e voltará a Aguardando conferência. Cada versão terá seus anexos e observações. O prazo da correção será acompanhado separadamente do prazo original.

**RF08 Dispensa e prazo**

Dispensar exigirá justificativa. Uma dispensa não contará como pendência ou entrega recebida. Reativar uma obrigação dispensada preservará o histórico. Inativar um professor não apagará nem dispensará automaticamente obrigações já existentes.

O prazo aplicável será copiado para cada acompanhamento; exceções individuais serão permitidas com justificativa. Alterar o prazo coletivo exigirá indicar quais acompanhamentos serão afetados. O histórico preservará os valores anteriores.

**Indicadores e relação com tarefas**

Uma entrega tardia continuará identificada após o recebimento. O indicador original usará a primeira entrega válida e o prazo vigente registrado naquele recebimento; revisões não substituirão essa informação. Pendências usarão o prazo aplicável atual. Recebidos e conferidos serão contados separadamente, excluindo dispensados do total exigido. Sem exigências, a taxa será Não se aplica.

Receber todos os materiais não concluirá automaticamente a tarefa pessoal de conferi-los. Se um registro de recebimento for corrigido ou invalidado, o motivo e os valores anteriores serão preservados.

## Telas e experiência de uso

O menu principal terá Início, Minhas tarefas, Realizadas, Entregas, Professores, Turmas e disciplinas, Agenda, Relatórios e Configurações. No celular, a navegação será recolhível e as listas terão uma apresentação adequada à largura disponível.

| Tela | Conteúdo e ações principais |
| --- | --- |
| Início | Tarefas de hoje, atrasadas, próximos compromissos e entregas pendentes |
| Minhas tarefas | Busca, filtros, cadastro, edição, etapas e botão Concluir |
| Realizadas | Consulta por data de conclusão, área e ação Reabrir |
| Entregas | Solicitações e tabela de professores com recebimento, conferência e prazo |
| Detalhe da entrega | Versões, anexos, histórico, recebimento, conferência e ajustes |
| Professores | Cadastro, ativação, vínculos e consulta das entregas |
| Turmas e disciplinas | Cadastros e vínculos por ano letivo |
| Agenda | Semana e mês com prazos e compromissos cadastrados |
| Relatórios | Filtros, totais, detalhes, CSV e impressão |
| Configurações | Perfil, escola, ano letivo e preferências |

**RF09 Agenda**

Compromissos terão título, início, término e observação opcional. O término não poderá ser anterior ao início. Prazos serão lidos diretamente das tarefas e entregas; não serão eventos independentes duplicados. Clicar em um prazo abrirá o registro de origem.

**RF10 Relatórios**

Tarefas realizadas serão contadas uma vez por tarefa atualmente concluída, pela data de conclusão. Materiais serão contados por obrigação de professor, e não por número de anexos ou versões. Filtros e critérios deverão aparecer também na impressão e exportação.

**Requisitos de usabilidade**

Todos os formulários terão rótulos e mensagens de erro em português. Estados vazios indicarão a próxima ação. Carregamentos, falhas e ações concluídas serão distinguíveis. Botões de envio serão protegidos contra cliques repetidos.

Os estados terão texto e cor, sem depender apenas da cor. Navegação por teclado, foco visível, contraste e leitura em telas pequenas serão verificados. O protótipo deverá representar também estados vazios, erros e uma entrega devolvida para ajustes.

## Tecnologias e organização dos dados

TypeScript será a linguagem principal. Next.js com React organizará interface e operações de servidor. CSS com Tailwind CSS definirá a apresentação. PostgreSQL no Supabase armazenará dados; Supabase Auth cuidará da autenticação e Supabase Storage dos anexos privados. Em 04/11/2026, o coordenador optou por manter aplicação, banco e anexos no próprio notebook, adiando a hospedagem.

Git e um repositório privado no GitHub registrarão o código quando essa estrutura for preparada. Vitest verificará regras e Playwright verificará fluxos pelo navegador. Versões compatíveis serão fixadas na etapa técnica, com arquivo de dependências travadas.

| Entidade | Conteúdo e vínculo principal |
| --- | --- |
| Escola e anos letivos | Contexto dos registros e períodos |
| Perfis e acesso à escola | Identidade autenticada e permissões |
| Professores | Nome, contato opcional e ativo ou inativo |
| Turmas e disciplinas | Cadastros associados à escola |
| Vínculos docentes | Professor, turma, disciplina e ano letivo |
| Tarefas e etapas | Dados da atividade, responsável e itens de verificação |
| Solicitações | Material, instruções, período e prazo padrão |
| Obrigações de entrega | Uma por solicitação e professor, com prazo aplicável |
| Versões recebidas | Data real, canal, conferência e prazo de correção |
| Anexos | Caminho privado, nome, tamanho, tipo e versão relacionada |
| Compromissos | Título, início, término e responsável |
| Eventos de histórico | Autor, ação, horário, entidade e mudanças relevantes |

Cada registro terá identificador estável e datas de criação e atualização quando aplicável. Relacionamentos usarão chaves estrangeiras. A combinação solicitação e professor terá restrição de unicidade no banco. Vínculos docentes também não poderão ser duplicados.

Tarefas pessoais pertencerão ao usuário. Registros escolares terão vínculo com a escola, e registros anuais terão vínculo com o ano letivo. Não será permitido associar uma turma ou professor de outra escola por alteração de identificadores enviados pelo navegador.

Instantes serão armazenados em UTC e apresentados no fuso local; datas sem horário serão preservadas como datas. Exclusões físicas de registros históricos não farão parte das ações comuns. A evolução do banco será registrada em migrações, permitindo reproduzir sua estrutura.

## Arquitetura e operação

O navegador exibirá as telas e enviará as operações autenticadas. O servidor Next.js validará entradas e regras; o banco aplicará integridade e políticas de acesso por registro. O armazenamento manterá os arquivos privados. Esconder um botão na interface não substituirá autorização no servidor e no banco.

**Autenticação e permissões**

O acesso inicial será individual e o cadastro público ficará desabilitado. O coordenador administrará os dados da própria escola e suas tarefas. Senhas serão gerenciadas pelo provedor de autenticação. Recuperação de acesso dependerá da configuração de e-mail e das URLs autorizadas na etapa técnica.

Chaves privilegiadas ficarão somente no servidor e fora do repositório. Políticas de acesso serão testadas com sessão válida, sessão ausente e usuário sem vínculo. Uma segunda identidade fictícia será usada nos testes de isolamento, sem criar um portal para professores.

**Arquivos e exportações**

Limite inicial proposto: 10 MB por arquivo, nos formatos PDF, DOCX, XLSX, PNG e JPG. O servidor validará tipo, extensão e tamanho. O acesso aos arquivos exigirá sessão autorizada ou link temporário. Links externos conservarão as permissões do serviço de origem.

Uma falha parcial no upload não poderá produzir um anexo utilizável falso. Arquivos órfãos deverão ser identificados e tratados. Anexos antigos serão preservados enquanto suas versões existirem. Exportações CSV neutralizarão conteúdo que possa ser interpretado como fórmula ao abrir em planilhas.

**Ambientes e continuidade**

Desenvolvimento e testes usarão dados fictícios. Dados reais entrarão no piloto, depois da verificação de acesso. Produção terá configuração própria. O processo de publicação incluirá validação das migrações, variáveis de ambiente e possibilidade de retornar à versão anterior da aplicação.

A rotina de backup abrangerá banco e arquivos. Como meta inicial de operação, propõe-se cópia diária e retenção de 30 dias; mecanismo, custo e capacidade deverão ser confirmados antes da produção. Será executado um teste de restauração. Exportar CSV não substitui backup completo.

Por decisão de 04/11/2026, a etapa 8 entrega a operação local, sem contratação de hospedagem. Depois da instalação inicial, tarefas, agenda e anexos locais funcionam sem depender de internet; links externos mantêm essa dependência. Hospedagem, domínio e e-mail externo serão avaliados no futuro, com autorização específica.

**Referências técnicas**

Next.js: https://nextjs.org/docs

Supabase: https://supabase.com/docs

Permissões no banco: https://supabase.com/docs/guides/database/postgres/row-level-security

Hospedagem: https://vercel.com/docs/frameworks/full-stack/nextjs

## Etapas de construção e aprovações

**Etapa 1 Definição final**

Entregar este documento, regras, modelo conceitual de dados, critérios de aceite e registro de andamento. Saída esperada: escopo rastreável e próxima etapa identificada. Apresentar ao usuário e aguardar autorização para o protótipo.

**Etapa 2 Protótipo visual**

Criar telas navegáveis com dados fictícios para painel, tarefas, realizadas, solicitações, detalhe de entrega, cadastros, agenda e relatórios. Demonstrar os fluxos de concluir, reabrir, receber e pedir ajustes, no computador e celular. Saída: avaliação visual e de navegação. Ainda sem autenticação real ou dados persistentes de produção.

**Etapa 3 Estrutura técnica**

Preparar projeto Next.js, dependências fixadas, configuração, migrações PostgreSQL, autenticação, políticas de acesso e armazenamento privado. Organizar o versionamento e documentar a execução local. Validar login, recuperação, integridade e isolamento. Credenciais serão configuradas de forma privada quando necessárias.

**Etapa 4 Tarefas e agenda**

Implementar cadastro, filtros, etapas, conclusão, reabertura, histórico, compromissos e prazos. Conectar essas telas ao banco e testar persistência, duplicações, datas e falhas. Saída: rotina individual utilizável.

**Etapa 5 Entregas dos professores**

Implementar cadastros escolares, vínculos docentes, solicitações coletivas, obrigações individuais, recebimentos, versões, conferências, ajustes, dispensas e anexos. Validar alterações de prazo, upload e preservação do histórico. Saída: acompanhamento completo dos materiais.

**Etapa 6 Relatórios e validação**

Conectar os indicadores do painel, relatórios, CSV e impressão aos dados reais do sistema. Executar os testes de aceite, acessibilidade básica, permissões, falhas e uso em celular. Saída: evidências dos testes e correções das falhas encontradas.

**Etapa 7 Projeto piloto**

Usar poucos registros representativos com o coordenador: tarefas, professores e materiais. Verificar clareza das telas e aderência à rotina. Registrar os ajustes necessários, corrigir os problemas e repetir os cenários afetados. Saída: aceite do piloto.

**Etapa 8 Uso no notebook e entrega — escopo atualizado em 04/11/2026**

Preparar atalhos de inicialização, backup diário na abertura e backup manual. Verificar recuperação em ambiente isolado, preservar os dados do piloto e entregar instruções de uso, encerramento, recuperação de senha e cópia externa. Saída: sistema utilizável no notebook e operação documentada. Publicação e subdomínio ficam adiados. O guia vigente é `etapa-8-notebook.md`; o documento Word original registra o planejamento inicial.

Ao fim de cada etapa, registrar resultado e evidências, solicitar autorização e aguardar. O cronograma será estimado após o protótipo e a confirmação do ambiente, sem tratar previsões como datas garantidas.

## Critérios de aceite e situação inicial

Os cenários abaixo orientam os testes da construção. Nesta etapa de documentação, eles estão definidos, mas ainda não foram executados em uma aplicação.

| Código | Cenário | Resultado esperado |
| --- | --- | --- |
| AC01 | Sair e retornar após salvar | Dados preservados e visíveis |
| AC02 | Concluir e reabrir tarefa | Histórico preservado e contagens corretas |
| AC03 | Prazo perto da meia-noite | Atraso calculado no fuso configurado |
| AC04 | Solicitar a dez professores | Dez obrigações, sem duplicação |
| AC05 | Receber material de um docente | Apenas seu acompanhamento alterado |
| AC06 | Receber material vencido | Entrega tardia preservada no histórico |
| AC07 | Solicitar ajuste e receber revisão | Versões anteriores acessíveis |
| AC08 | Dispensar e reativar obrigação | Justificativa e totais coerentes |
| AC09 | Conferir sem recebimento | Operação recusada |
| AC10 | Abrir dados sem permissão | Acesso negado a dados e arquivos |
| AC11 | Comparar relatório e detalhes | Mesmos totais e filtros |
| AC12 | Falha de rede ou upload | Erro claro, sem sucesso falso |
| AC13 | Usar teclado e celular | Fluxos essenciais acessíveis |
| AC14 | Restaurar cópias de segurança | Registros e anexos recuperados |

As validações serão distribuídas entre testes de regras, integração com banco e armazenamento, e fluxos no navegador. Os testes automatizados terão foco nas regras e nos riscos reais; a inspeção visual complementará a verificação das telas.

**Registro de início**

Em 29 de outubro de 2026, o projeto foi aprovado conceitualmente e sua execução foi autorizada com aprovação entre etapas. A pasta de trabalho foi inspecionada e estava vazia, sem código ou repositório Git existente. Não havia instruções AGENTS.md nos caminhos de projeto e ancestrais verificados.

Etapa 1: requisitos e planejamento documentados, entregues para avaliação. Etapas 2 a 8: não iniciadas. A autorização solicitada após esta entrega será exclusivamente para a etapa 2, protótipo visual.

**Histórico do documento**

Versão 1.0, de 29 de outubro de 2026: consolidação do projeto aprovado, detalhamento das regras, critérios de aceite e sequência de execução. Decisões técnicas operacionais propostas neste documento serão verificadas nas respectivas etapas antes da entrada em produção.
