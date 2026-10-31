# Minha Rotina Escolar

Sistema web planejado para organização de tarefas de coordenação e docência e acompanhamento da entrega de materiais dos professores.

## Documentação

- [Projeto e etapas de construção](docs/projeto-sistema.md)
- [Documento para leitura em Word](docs/projeto-sistema.docx)
- [Andamento e aprovações](docs/andamento.md)
- [Guia de avaliação da etapa 2](docs/etapa-2-prototipo.md)
- [Protótipo navegável](prototipo/index.html)

## Estado atual

Etapas 1 e 2 concluídas: requisitos documentados e protótipo visual navegável. A etapa 3 aguarda autorização. O documento Word é a referência original de planejamento; o andamento registra a situação atual.

## Abrir o protótipo

Abra `prototipo/index.html` em um navegador. Os arquivos CSS e JavaScript devem permanecer na mesma pasta.

Para usar um servidor local com Node.js, execute na raiz do projeto:

```powershell
node prototipo/serve.mjs
```

Acesse http://127.0.0.1:4173. O servidor atende somente a interface local e os arquivos do protótipo. Encerre com Ctrl+C no terminal em que foi iniciado.

Não é necessário instalar dependências. A demonstração usa HTML, CSS e JavaScript, com dados fictícios em memória e data de referência de 29/10/2026. Recarregar reinicia os exemplos. A aplicação TypeScript/Next.js com banco de dados será preparada na etapa 3.

## Continuidade

Executar uma etapa por vez. Ao concluir, apresentar o resultado e perguntar se pode continuar. Aguardar autorização expressa antes da etapa seguinte, conforme solicitado pelo usuário. A próxima etapa é a estrutura técnica.

Por instrução do usuário em 30/10/2026, ao concluir cada etapa:

1. Verificar o trabalho e atualizar o registro de andamento.
2. Criar um commit no Git com os arquivos da etapa e uma mensagem descritiva.
3. Enviar o commit ao GitHub em `origin` (`https://github.com/fredhansenads/projeto3-task_organizer.git`).
4. Confirmar a sincronização e informar o commit na entrega.
5. Perguntar se pode iniciar a próxima etapa e aguardar autorização.

Commit e envio ao GitHub já estão autorizados para o encerramento de cada etapa. Se o envio falhar, informar a pendência sem declarar que houve sincronização. Essa regra não autoriza iniciar a próxima etapa nem publicar o sistema em hospedagem.

## Tecnologias planejadas

TypeScript, Next.js, React, Tailwind CSS, PostgreSQL, Supabase Auth e Storage. Hospedagem proposta na Vercel. Versões e configuração serão definidas na etapa técnica.
