# Etapa 3 · Estrutura técnica

A aplicação permite entrar com a conta da coordenação, consultar as escolas vinculadas à conta, sair e recuperar a senha por e-mail. A administração cria as contas. Professores são registros escolares. O protótipo da etapa 2 continua disponível para consultar as telas planejadas.

## Executar no computador

Use Node.js 22.12 ou superior, pnpm 11.25.0 e Docker com contêineres Linux. Abra um terminal na raiz deste repositório e execute:

```powershell
pnpm install --frozen-lockfile
pnpm exec supabase start -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor,studio
node scripts/setup-local.mjs
pnpm dev
```

Abra [a aplicação local](http://127.0.0.1:3000). O script configura uma escola fictícia e grava o e-mail e a senha de demonstração em `.env.demo.local`. Consulte esse arquivo no seu computador. Para recuperar o acesso, use **Esqueci minha senha** e abra a mensagem na [caixa de e-mail de teste](http://127.0.0.1:54324). Uma redefinição altera a senha da conta, e a senha antiga no arquivo de demonstração deixa de valer.

A aplicação lê a URL do Supabase e a chave pública de `.env.local`. O script de preparação só aceita o Supabase local na porta 54321 e preserva configurações existentes. Mantenha as credenciais fora do controle de versão. A chave administrativa é usada apenas pelo script local. Use dados fictícios neste ambiente.

Para encerrar a aplicação, pressione Ctrl+C. Para parar os serviços preservando os dados, execute `pnpm exec supabase stop`. Para atualizar uma instalação local existente, aplique migrações pendentes com `pnpm exec supabase migration up --local`.

## Banco, histórico e arquivos

A migração em `supabase/migrations` cria as tabelas da escola, dos anos letivos, dos cadastros docentes, das tarefas, dos compromissos, das entregas e dos anexos. Um vínculo ativo permite ler os dados da escola. Tarefas, itens de verificação, compromissos e seus históricos também exigem que a conta seja a proprietária. O painel distingue uma escola disponível de uma conta ainda sem vínculo.

As chaves estrangeiras conferem a escola ao relacionar registros. Uma solicitação comporta uma obrigação por professor, e cada obrigação comporta várias versões numeradas. Alterações em tarefas e entregas geram histórico no banco. O cliente tem permissão de leitura sobre as tabelas nesta etapa. Cada módulo posterior acrescentará suas operações de escrita e respectivas validações.

O bucket privado `materiais` admite arquivos PDF, DOCX, XLSX, PNG e JPEG de até 10 MiB. O caminho de um objeto é formado pelos identificadores da escola, da versão e do anexo. A política permite ler ou enviar o arquivo quando o usuário tem acesso ao registro correspondente. A interface de envio e a conferência de conteúdo pertencem à etapa 5.

## Repetir a validação

```powershell
pnpm test
pnpm typecheck
pnpm build
```

O primeiro teste executa a migração em PostgreSQL em memória e exercita permissões com uma conta proprietária, outra da mesma escola, uma sem vínculo e o papel anônimo. Ele também verifica restrições de integridade e as regras de acesso aos objetos.

Com o Supabase e a aplicação em execução no endereço indicado, rode `pnpm test:auth` em outro terminal. O teste cria uma conta fictícia temporária, envia os formulários de entrada e recuperação à aplicação, lê o e-mail local e verifica se a senha antiga e a reutilização do link são rejeitadas. Ao terminar, remove a conta e a escola criadas para esse teste.

O teste também envia e baixa um PDF fictício pelo Storage. Verifica o bloqueio por tipo de arquivo e a perda de acesso ao desativar o vínculo com a escola.

O planejamento da publicação prevê configurar a URL do ambiente, os redirecionamentos autorizados, o serviço de e-mail e o mesmo modelo de mensagem em `supabase/templates/recovery.html`. A hospedagem depende da aprovação da etapa 8.
