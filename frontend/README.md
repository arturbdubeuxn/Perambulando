# Frontend Perambulando

Atualização: 15/11/2026.

## Painel do proprietário — US24

O ícone Painel na navegação inferior da criação de evento abre `/painel` pelo Expo Router. A página mantém as cores e o formato mobile existentes, com as abas Visão geral e Minha assinatura. Criar evento retorna a `/`; Comércio abre `/cadastro_host`.

### Implementação

- Sem integração, a visão inicial apresenta métricas indisponíveis, sem atribuir números fictícios ao proprietário autenticado.
- A demonstração opcional apresenta o estabelecimento fictício Casa Aurora, períodos de 7, 30 e 90 dias, visitas às programações e ao estabelecimento, cliques para ingressos, taxa de interesse, evolução e comparação por programação.
- A taxa de interesse divide cliques para ingressos por visitas às programações; não mede vendas. Visitas não representam visitantes únicos. O gráfico mostra intervalos do início ao fim do período selecionado.
- A seção Ideias para crescer apresenta uma vitrine comercial de serviços propostos: destaque de programação na homepage, inserções patrocinadas, vitrines de estabelecimentos e divulgação para ocasiões especiais. Os botões abrem a aba Minha assinatura para conhecer os planos; não compram serviços individuais. Não há análises personalizadas, recomendações geradas por IA ou garantias de alcance, cliques e vendas. Disponibilidade, posicionamentos e condições comerciais ainda dependem de definição e integração.
- Planos Essencial, Impulso e Destaque têm preços e benefícios propostos, identificados como exemplos sem valor de oferta comercial.
- A demonstração destaca o plano atual somente no estado ativo e permite visualizar assinatura pendente, ativa, vencida e cancelada, consultar detalhes e confirmar cancelamento. Iniciar contratação simulada deixa o plano selecionado pendente; não ativa benefícios por clique ou por retorno de checkout.
- Os cenários ficam somente em memória, são reiniciados ao entrar/sair da demonstração e não alteram assinaturas reais. Não há campos de cartão, cobrança ou redirecionamento para endereços externos.

### Validações realizadas

- `npm run lint`: aprovado.
- `tsc --noEmit`: aprovado.
- `expo export --platform web`: aprovado, incluindo o bundle da rota `/painel`.
- As verificações usaram uma cópia temporária do frontend no container existente e suas dependências instaladas. Não foram executados testes no backend nem gravações no banco.
- Revisão visual e interação manual no navegador permanecem pendentes.

### Integrações pendentes

A US24 está demonstrada na interface, mas ainda depende de integração para operação real: catálogo/preços oficiais, seleção e autorização do host, métricas por proprietário, consulta de assinatura, criação de sessão de checkout e cancelamento persistente. Nenhum contrato de API foi inventado nesta implementação.

O checkout real deverá usar uma URL HTTPS emitida pelo backend autenticado e validada contra os domínios permitidos do provedor escolhido. A confirmação do estado deve vir de consulta ao servidor após processamento pelo provedor, sem confiar em parâmetros de retorno do navegador. Consulta e cancelamento também precisam de estados de carregamento, erro e confirmação do serviço. Não devem ser coletados dados completos do cartão no frontend.

Sugestões futuras de BI: origem do tráfego, horários de maior interesse, comparação por categoria, visitantes únicos e recorrentes, cliques em rota/contato e evolução antes/depois de campanhas. Exigem coleta e definição próprias; não são dados disponíveis hoje.

### Docker neste ambiente

O container `perambulando-dev-frontend-1` usa arquivos internos, sem bind mount. Os três arquivos de implementação foram copiados para `/app/src` e o serviço foi reiniciado para disponibilizar a tela. Uma recriação pela imagem antiga perde essa cópia; um build futuro deve incluir o código atualizado de `frontend/`. O `compose.dev.yaml` indicado nos labels do container não está neste checkout.

Somente `frontend/` foi alterado, conforme a restrição do usuário. A documentação desta entrega permanece aqui; `docs/`, backend, banco e protótipo externo não foram modificados. Nenhum PDF foi gerado.
