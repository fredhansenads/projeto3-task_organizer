# Minha Rotina Escolar

Sistema web planejado para organização de tarefas de coordenação e docência e acompanhamento da entrega de materiais dos professores.

## Documentação

- [Projeto e etapas de construção](docs/projeto-sistema.md)
- [Documento para leitura em Word](docs/projeto-sistema.docx)
- [Andamento e aprovações](docs/andamento.md)
- [Guia de avaliação da etapa 2](docs/etapa-2-prototipo.md)
- [Aplicação local e testes da etapa 3](docs/etapa-3-estrutura.md)
- [Tarefas, realizadas e agenda da etapa 4](docs/etapa-4-rotina.md)
- [Protótipo navegável](prototipo/index.html)

## Estado atual

A coordenação já pode organizar tarefas por área, acompanhar etapas, marcar atividades realizadas e consultar compromissos e prazos na agenda. O acesso é individual, por e-mail e senha. O guia da etapa 3 explica como iniciar o banco local e preparar a conta de demonstração. O guia da etapa 4 descreve a rotina diária e seus testes.

## Abrir o protótipo

Abra `prototipo/index.html` em um navegador. Os arquivos CSS e JavaScript devem permanecer na mesma pasta.

Para usar um servidor local com Node.js, execute na raiz do projeto:

```powershell
node prototipo/serve.mjs
```

Acesse http://127.0.0.1:4173. O servidor atende somente a interface local e os arquivos do protótipo. Encerre com Ctrl+C no terminal em que foi iniciado.

A demonstração usa HTML, CSS e JavaScript, com dados fictícios em memória e data de referência de 29/10/2026. Recarregar reinicia os exemplos.

## Continuidade

Executar uma etapa por vez. Ao concluir, apresentar o resultado e perguntar se pode continuar. Aguardar autorização expressa antes da etapa seguinte, conforme solicitado pelo usuário.

Por instrução do usuário em 30/10/2026, ao concluir cada etapa:

1. Verificar o trabalho e atualizar o registro de andamento.
2. Criar um commit no Git com os arquivos da etapa e uma mensagem descritiva.
3. Enviar o commit ao GitHub em `origin` (`https://github.com/fredhansenads/projeto3-task_organizer.git`).
4. Confirmar a sincronização e informar o commit na entrega.
5. Perguntar se pode iniciar a próxima etapa e aguardar autorização.

Commit e envio ao GitHub já estão autorizados para o encerramento de cada etapa. Se o envio falhar, informar a pendência sem declarar que houve sincronização. Essa regra não autoriza iniciar a próxima etapa nem publicar o sistema em hospedagem.

## Tecnologias planejadas

TypeScript, Next.js, React, Tailwind CSS, PostgreSQL, Supabase Auth e Storage. As versões estão fixadas em `package.json` e `pnpm-lock.yaml`. Hospedagem proposta na Vercel para a etapa 8.
