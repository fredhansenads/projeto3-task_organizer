# Etapa 8 · Uso no notebook

Decisão aprovada em 04/11/2026: usar o sistema neste notebook por enquanto. A hospedagem e o subdomínio `tarefas.fredhansen.com.br` ficam para uma decisão futura. Nenhuma contratação ou publicação faz parte desta etapa.

## Abrir o sistema

1. Dê dois cliques no atalho **Minha Rotina Escolar**, na Área de Trabalho, ou no arquivo **Iniciar sistema.cmd**, na pasta do projeto.
2. Aguarde a preparação. O atalho inicia o Docker Desktop quando necessário, inicia os serviços locais e verifica o backup do dia. Na primeira abertura ou após alterações no código, também compila a aplicação.
3. O navegador abre em **http://127.0.0.1:3000**. Entre com a conta já utilizada no piloto.
4. Mantenha a janela de inicialização aberta enquanto trabalha. Ela mostra erros se algo não puder ser iniciado.

Os dados do piloto permanecem disponíveis. O atalho não recria escolas, não troca senhas e não limpa o banco. A conta de demonstração originalmente preparada está no arquivo privado `.env.demo.local`; se você mudou a senha pelo sistema, use a senha atual.

Após a instalação e o download inicial das dependências e imagens, o uso de tarefas, agenda, relatórios e anexos locais não exige um serviço na internet. Links de materiais hospedados em outros sites continuam dependendo de internet. O computador precisa estar ligado e os serviços locais em execução.

## Terminar de trabalhar

1. Salve as alterações nos formulários.
2. Execute **Backup - Minha Rotina Escolar**, na Área de Trabalho, ou **Fazer backup.cmd**. Aguarde a mensagem de conclusão.
3. Use **Encerrar - Minha Rotina Escolar**, na Área de Trabalho, ou **Encerrar sistema.cmd**. Também pode voltar à janela do sistema e pressionar **Ctrl+C**.

O Docker e o banco podem continuar ativos. Se precisar liberar memória, encerre o Docker Desktop pelo próprio aplicativo, desde que nenhum outro sistema esteja usando seus serviços. Desligar o Windows normalmente também encerra os serviços; os volumes persistem.

## Cópias de segurança

O primeiro uso de cada dia cria uma cópia em `backups/`, dentro da pasta do projeto. A data considera o fuso de São Paulo. É uma cópia feita na abertura, não um agendamento com o computador desligado ou um backup contínuo. Para incluir o trabalho feito depois da abertura, use o atalho de backup ao terminar.

Durante a cópia, os serviços deste projeto param brevemente. Não envie formulários ou anexos nesse intervalo. O script reinicia os serviços que estavam ativos, inclusive se houver erro na cópia. Outros projetos Docker não são parados. Se a janela for fechada à força ou faltar energia, abra o sistema novamente; uma pasta terminada em `.incompleto` não é uma cópia válida.

Cada pasta concluída contém:

| Conteúdo | Finalidade |
| --- | --- |
| Volume PostgreSQL compactado | Banco completo, usuários, senhas protegidas pelo Auth, permissões e histórico |
| Volume de Storage compactado | Conteúdo dos anexos |
| `database.dump` e `roles.sql` | Cópias lógicas auxiliares para recuperação técnica e migração |
| Configuração local, versões e `manifest.json` | Recriar o ambiente e conferir integridade por SHA-256 |
| `verification.json`, após verificação | Registro da data do ensaio de restauração |

**Copie a pasta inteira de uma cópia concluída para um pendrive ou disco externo.** Uma cópia no mesmo notebook não protege contra perda do equipamento ou defeito no disco. Os backups contêm dados e credenciais locais, não são criptografados por este script e devem ser guardados em local privado; prefira uma unidade criptografada. Nunca os envie ao GitHub.

Não há exclusão automática de backups. Como rotina inicial, guarde as últimas 30 cópias diárias e revise o espaço ocupado. Só remova cópias antigas depois de conferir uma cópia recente e sua cópia externa. O tamanho aumenta conforme o banco e os anexos crescem.

## Conferir se uma cópia pode ser recuperada

Arraste a pasta de um backup concluído para o arquivo **Verificar backup.cmd**, na pasta do projeto. Também é possível executar:

```powershell
node scripts/notebook.mjs verify "C:\caminho\para\a\pasta-do-backup"
```

O verificador confere os arquivos, extrai banco e anexos em **volumes temporários separados**, compara o conteúdo dos arquivos, inicia uma cópia do PostgreSQL sem portas publicadas nem acesso à rede e confere os registros do banco. Ao terminar, remove somente seus recursos temporários. O banco atual permanece intacto. O processo precisa de espaço livre para a cópia descompactada e da mesma imagem PostgreSQL indicada no manifesto.

Faça essa verificação periodicamente e antes de remover cópias antigas. Ela confere a integridade técnica da cópia; depois de uma recuperação definitiva, também entre no sistema, confira tarefas e abra um anexo.

## Recuperar após perda do ambiente

Este é um procedimento técnico para uma instalação **vazia**. Se o sistema atual ainda contém dados, preserve-o e peça assistência para escolher a cópia correta. O restaurador recusa substituir volumes existentes.

1. Recupere o código do GitHub, usando a versão registrada em `codeCommit` no manifesto. Para as primeiras cópias feitas durante esta etapa, use o commit de entrega da etapa 8, que contém os scripts. Instale Node.js compatível, pnpm e Docker Desktop com contêineres Linux.
2. Execute `pnpm install --frozen-lockfile`. Use a mesma versão do Supabase CLI e o mesmo `supabase/config.toml` da cópia. Não execute `setup-local`, `setup-pilot`, `supabase start` ou `db reset` antes da restauração.
3. Disponibilize a imagem PostgreSQL identificada no manifesto. Se ela não estiver no Docker, será necessário recuperá-la ou baixar a imagem exata; o verificador recusa substituir silenciosamente sua versão. As outras imagens também precisam estar disponíveis para a primeira inicialização do Supabase.
4. Com o Docker aberto, execute:

```powershell
node scripts/notebook.mjs restore-empty "C:\caminho\para\a\pasta-do-backup"
```

5. Abra **Iniciar sistema.cmd**, entre com a senha válida na data do backup, confira tarefas, relatórios e um anexo. Se necessário, recupere a senha pelo fluxo abaixo.

Se já existirem volumes do projeto, configuração local ou versões incompatíveis, o procedimento para sem substituir esses dados. Se uma falha ocorrer durante a extração definitiva, preserve os volumes e solicite análise; não use comandos de limpeza geral do Docker. A recuperação retorna ao momento da cópia: alterações posteriores não estão nela.

## Recuperar a senha local

Na tela de entrada, use **Esqueci minha senha** com o e-mail da conta. As mensagens locais aparecem em **http://127.0.0.1:54324**, enquanto o Supabase estiver ativo. Abra a mensagem e siga o link para definir a nova senha. Nesse ambiente, a mensagem é capturada pelo serviço local de e-mail; ela não chega ao Gmail ou a outro provedor.

## Problemas comuns

| Situação | O que fazer |
| --- | --- |
| Docker não inicia | Abra o Docker Desktop, aguarde o mecanismo Linux ficar pronto e repita o atalho |
| Porta 3000 ocupada | Se já houver uma janela deste sistema, use-a; se outro programa usar a porta, encerre esse programa antes |
| Inicialização ou backup já em andamento | Aguarde a outra janela; uma operação não concorre com a outra |
| Pasta `.incompleto` | Corrija o erro informado, como falta de espaço, e faça outra cópia; não use a incompleta |
| Falha no backup automático | A nova inicialização para e mostra o erro; resolva-o e tente novamente |
| Após suspender o notebook | Aguarde o Docker retomar e recarregue o navegador; se necessário, reabra o atalho |
| Senha do arquivo não entra | Se ela já foi trocada, use a senha atual ou recupere pelo e-mail local |

Não use `docker volume prune`, limpeza de dados/factory reset do Docker nem `supabase db reset` na rotina de uso: esses comandos podem remover dados. O GitHub armazena o código, não o banco ou os anexos.

## Configuração e limites

- Next.js roda compilado, com escuta em `127.0.0.1:3000`. O endereço não depende do domínio.
- PostgreSQL, Auth e Storage continuam no Supabase local. A CLI fornece um ambiente local de desenvolvimento; esta entrega o mantém para uso individual, não o transforma em hospedagem pública. As portas dos contêineres podem escutar nas interfaces de rede do computador, conforme o Docker. Mantenha o firewall ativo e não libere nem encaminhe essas portas no roteador.
- O fluxo de inicialização não aplica migrações destrutivas, atualiza dependências nem recria dados do piloto. Atualizações futuras precisam de backup e validação próprios.
- A restauração física exige a imagem PostgreSQL compatível. Os arquivos lógicos auxiliam uma migração futura, que deverá incluir Auth, permissões e anexos, além do banco.
- Atalhos da Área de Trabalho podem ser recriados com `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-shortcuts.ps1`. Se mover a pasta do projeto, recrie os atalhos.

Referências: [CLI local do Supabase](https://supabase.com/docs/reference/cli/introduction) e [operação própria do Next.js](https://nextjs.org/docs/app/guides/self-hosting). As regras de execução do Next.js também foram conferidas na documentação instalada da versão fixada no projeto.

## Validação desta etapa

Os resultados finais estão registrados em [Andamento](andamento.md). Para repetir o ensaio com dados fictícios, execute `pnpm test:notebook` com o Supabase local disponível. O ensaio cria uma escola temporária e um PDF, verifica a cópia, rejeita corrupção e restauração sobre dados existentes, e remove seus registros temporários. O backup do ensaio fica em `.artifacts/`, separado dos backups de uso diário.
