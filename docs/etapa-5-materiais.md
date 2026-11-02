# Etapa 5 · Entregas dos professores

O acompanhamento é individual. Uma solicitação para dez professores cria dez obrigações, cada uma com prazo, recebimento e conferência próprios. Os cadastros e os materiais são acessíveis à coordenação com vínculo ativo na escola.

## Avaliar o fluxo

1. Entre no [sistema local](http://127.0.0.1:3000/painel). Em **Turmas e disciplinas**, cadastre o ano letivo, a turma e a disciplina. Em **Professores**, cadastre o docente. Abra o nome dele para editar o contato, vincular uma turma e disciplina ou consultar seus materiais.
2. Em **Entregas → Nova solicitação**, informe o material, ano, período e prazo. Selecione os professores e salve. Na solicitação, você pode incluir outros docentes ativos ou alterar o prazo padrão e escolher os acompanhamentos afetados. Para uma exceção individual, abra a entrega do professor e justifique a alteração.
3. Abra o acompanhamento e registre a data **real** do recebimento, o canal e, se desejar, observações e um link. O sistema grava separadamente o momento do registro. O prazo vigente na primeira entrega válida determina se o material chegou atrasado.
4. Para guardar um arquivo, abra **Anexar arquivo à versão**, selecione o documento e clique em **Enviar arquivo**. PDF, DOCX, XLSX, JPG e PNG de até 10 MiB são aceitos. O download só fica disponível após a confirmação do armazenamento.
5. Marque a versão como **conferida** ou solicite ajustes, informando orientação e prazo da correção. Registre a revisão como nova versão. Ela volta a aguardar conferência, e a primeira versão continua disponível com suas anotações e anexos.
6. Para dispensar uma entrega pendente, informe o motivo. A dispensa sai do total exigido e pode ser revertida. Inativar o professor mantém os acompanhamentos existentes. Para corrigir um recebimento registrado por engano, invalide a última versão com justificativa e registre o recebimento correto.

A lista permite buscar por material ou docente e filtrar recebimento e conferência. A agenda mostra o prazo individual e o prazo de correção pendente. Clique no item para abrir a entrega. A conclusão de tarefas pessoais continua sendo uma decisão do usuário.

## Persistência e arquivos

A solicitação e suas obrigações são gravadas na mesma transação. O reenvio da operação com o mesmo identificador não duplica as linhas. Cada alteração em um acompanhamento verifica a revisão que o usuário abriu. Se outra pessoa já o alterou, atualize a página e confira o histórico antes de tentar novamente.

O servidor verifica tamanho, extensão, tipo e assinatura do arquivo. Para DOCX e XLSX, também verifica a estrutura do pacote. A reserva de upload vincula o caminho privado à escola, à versão e ao anexo. Em caso de interrupção, recarregue a entrega e abra **Envio pendente**. Use **Verificar arquivo no armazenamento** se o envio já tiver terminado ou escolha o mesmo arquivo para reenviar. A verificação compara o tamanho e o tipo com os metadados reais. O download exige acesso à escola e gera um link temporário de 60 segundos.

## Atualizar e testar no computador

Com o Docker e o Supabase local em execução, na raiz do projeto:

```powershell
pnpm install --frozen-lockfile
pnpm exec supabase migration up --local
pnpm build
pnpm start
```

Para uma instalação nova, siga primeiro a [preparação do ambiente local](etapa-3-estrutura.md). Para repetir a validação com a aplicação na porta 3000, execute `pnpm test:materiais` em outro terminal. O teste cria uma escola temporária e remove seus dados e arquivos ao terminar. No Windows utiliza o Edge instalado. Em outros sistemas, instale antes o Chromium com `pnpm exec playwright install chromium`.
