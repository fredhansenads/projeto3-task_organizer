# Etapa 8 · Proposta de publicação na AWS

Proposta arquivada a pedido do coordenador devido ao vencimento do Free Tier. O endereço escolhido continua sendo `tarefas.fredhansen.com.br`. As instruções abaixo eram específicas da alternativa AWS.

## Endereço do sistema

O coordenador escolheu **`tarefas.fredhansen.com.br`**. Em consulta pública de 03/11/2026, os servidores de nomes de `fredhansen.com.br` eram `a.auto.dns.br` e `b.auto.dns.br`. A consulta por `tarefas` retornou NXDOMAIN. Repetir a consulta antes de gravar o apontamento.

Quando houver um IPv4 estático associado à instância de produção, acessar o domínio no Registro.br e adicionar à zona DNS uma entrada do tipo **A**, com nome **tarefas** e valor igual ao **IPv4 estático da instância**. Se o painel estiver em modo básico, conferir o endereçamento existente antes de usar o modo avançado. Verificar a resolução pública e emitir o certificado HTTPS para `tarefas.fredhansen.com.br`. [DNS do Registro.br](https://registro.br/tecnologia/caracteristicas-tecnicas/)

## Hospedagem proposta

Para a carga inicial, avaliar uma instância Linux do Lightsail em São Paulo com IPv4 estático, Next.js e os serviços do Supabase em Docker de produção. A aplicação depende de PostgreSQL, Auth e Storage. Dimensionamento inicial para avaliação: 8 GB de RAM. A interrupção dessa instância afeta todo o sistema, e a equipe fica responsável pela manutenção e recuperação. [Preços do Lightsail](https://aws.amazon.com/lightsail/pricing/) · [Disponibilidade em São Paulo](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-lightsail-aws-regions/) · [Requisitos do Supabase](https://supabase.com/docs/guides/self-hosting/docker)

Referência pública para o pacote Linux de uso geral com IPv4, 8 GB de memória e 160 GB de SSD: **US$ 44/mês**. Confirmar o preço da região no console. Orçar à parte cópias externas do banco e dos anexos, e-mail de recuperação, eventuais excedentes e tributos. Antes de criar recursos, conferir no faturamento da conta o saldo, a validade e os serviços cobertos pelo crédito e definir o teto mensal após o vencimento. [Aplicação de créditos da AWS](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/useconsolidatedbilling-credits.html)

## Sequência de publicação após a definição de custos

1. Validar o orçamento e a região na conta escolhida. Configurar alerta de gastos.
2. Preparar o servidor com proxy HTTPS, aplicação e volumes persistentes. Restringir a administração e manter o PostgreSQL fora da internet pública.
3. Criar o ambiente de produção com novas credenciais, aplicar as migrações e configurar o cadastro fechado, a conta real da coordenação, o e-mail de recuperação e as URLs públicas. Os dados do piloto permanecem na instalação local.
4. Apontar o subdomínio, ativar HTTPS e testar login, redefinição de senha, tarefas, recebimento e download autorizado de anexos pelo endereço final.
5. Configurar cópias independentes do servidor, ensaiar uma restauração e registrar os resultados antes de encerrar a etapa.
