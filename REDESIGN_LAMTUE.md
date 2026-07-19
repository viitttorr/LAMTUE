# Redesign do Portal da LAMTUE

## 1. Objetivo

Criar uma nova variação visual do portal da LAMTUE, preservando integralmente o sistema atual e alterando apenas o layout, a composição visual, as animações e a experiência de navegação da interface.

A nova versão deve ser institucional, premium, tecnológica, cinematográfica, responsiva e funcional, sem perder a clareza própria de um portal acadêmico de Medicina.

A tarefa deve ser executada do diagnóstico inicial aos testes finais, sem interrupções para solicitar aprovação entre etapas.

## 2. Isolamento obrigatório

Antes de modificar qualquer arquivo:

1. Identifique o repositório, a branch atual e o estado do projeto.
2. Crie uma worktree exclusiva para este redesign.
3. Crie uma branch própria e claramente identificada para essa variação.
4. Realize todo o trabalho apenas nessa worktree.
5. Não altere a branch principal.
6. Não altere a versão atualmente publicada.
7. Não faça merge, push ou deploy.
8. Não exclua, sobrescreva ou substitua a versão atual.

Caso o ambiente já esteja executando em uma worktree ou cópia isolada criada automaticamente, confirme tecnicamente o isolamento e utilize uma branch exclusiva para o redesign.

A versão original deve permanecer intacta e funcional.

## 3. Escopo desta tarefa

Esta tarefa inclui apenas:

- novo layout;
- nova composição visual;
- reorganização visual da página inicial;
- refinamento visual das páginas internas;
- menu institucional fixo;
- navegação por capítulos na página inicial;
- animações e microinterações;
- immersive scrollytelling;
- profundidade 2.5D;
- loader inicial com ECG;
- transições entre rotas;
- responsividade;
- acessibilidade;
- desempenho relacionado à interface.

Não implementar nesta tarefa:

- formulário de inscrição de novos ligantes;
- upload de comprovantes;
- novos bancos de dados;
- novos serviços externos;
- novo painel administrativo;
- mudanças de autenticação;
- alterações no modelo de dados;
- novas funcionalidades institucionais não existentes.

## 4. Preservação integral do projeto atual

Manter integralmente:

- textos;
- logotipo;
- identidade visual;
- paleta de cores;
- imagens;
- páginas;
- rotas;
- seções;
- informações institucionais;
- links;
- formulários existentes;
- funcionalidades;
- integrações;
- autenticação;
- banco de dados;
- estrutura de conteúdo;
- dados já cadastrados;
- comportamentos funcionais já aprovados.

Não resumir, reescrever, excluir, inventar ou substituir conteúdos.

A disposição visual pode ser reorganizada quando necessário, desde que todo o conteúdo continue presente, acessível e associado à página ou função correta.

Reutilize componentes, serviços, rotas e lógica existentes apenas quando necessário para que o novo layout funcione com o sistema atual.

Não refatore áreas do sistema sem relação direta com o redesign.

## 5. Execução autônoma em fases

### Fase 1: diagnóstico

Inspecione:

- framework;
- sistema de rotas;
- componentes;
- estrutura da home;
- páginas internas;
- estilos globais;
- bibliotecas de animação existentes;
- fontes;
- imagens;
- ícones;
- integrações;
- mecanismos de carregamento;
- responsividade atual;
- scripts de build, lint e testes.

### Fase 2: planejamento técnico

Defina internamente:

- quais componentes serão preservados;
- quais componentes visuais serão criados;
- quais arquivos precisarão ser alterados;
- como a navegação híbrida será implementada;
- como funcionarão o loader inicial e as transições;
- como garantir desempenho, responsividade e acessibilidade.

Não pare após o planejamento. Continue diretamente para a implementação.

### Fase 3: implementação

Implemente o novo layout completo apenas na worktree isolada.

### Fase 4: validação

Execute:

- build;
- lint;
- testes disponíveis;
- verificação das rotas;
- verificação responsiva;
- verificação da navegação;
- verificação das animações;
- verificação do loader inicial;
- verificação de ausência de recarregamentos completos;
- revisão de erros no console.

### Fase 5: correções

Corrija os problemas identificados e repita as validações necessárias até deixar a versão funcional.

## 6. Conceito visual

O portal deve parecer:

- institucional;
- premium;
- tecnológico;
- cinematográfico;
- preciso;
- organizado;
- acadêmico;
- médico;
- moderno;
- confiável.

A direção visual deve combinar tecnologia, Medicina, organização institucional e resposta rápida.

Aplicar como princípios:

- fundos e superfícies derivados da paleta atual;
- contraste forte;
- composição assimétrica;
- espaço negativo;
- tipografia marcante;
- profundidade moderada;
- um foco visual dominante por seção;
- elementos técnicos discretos;
- continuidade entre capítulos;
- movimento ambiental controlado.

Não copiar diretamente layout, objetos, animações, cores, textos, modelos tridimensionais ou identidade visual de qualquer site de referência.

Não transformar o portal em:

- experiência cyberpunk;
- jogo;
- portfólio experimental;
- dashboard genérico;
- interface com excesso de glassmorphism;
- conjunto repetitivo de cards;
- cenário tridimensional complexo.

## 7. Paleta e identidade

Preserve a paleta atual da LAMTUE.

Todos os novos elementos devem derivar das cores já existentes:

- fundos;
- brilhos;
- bordas;
- linhas;
- ícones;
- transparências;
- estados de hover;
- indicadores;
- elementos ambientais.

É permitido criar variações de luminosidade, contraste e transparência das cores atuais quando necessário para profundidade e legibilidade.

Não importar uma nova paleta externa.

Preserve o logotipo, suas proporções e características oficiais.

## 8. Menu institucional fixo

O menu principal deve permanecer fixo no topo em todo o portal.

Preservar:

- logotipo;
- itens atuais;
- ícones atuais;
- páginas de destino;
- funcionalidades;
- hierarquia institucional.

O cabeçalho deve:

- permanecer legível sobre todas as seções;
- indicar claramente a página ativa;
- funcionar em desktop e celular;
- permitir acesso imediato às páginas internas;
- não bloquear conteúdo;
- não ocupar altura excessiva.

Pode haver:

- transparência controlada;
- mudança discreta de fundo após o scroll;
- redução moderada de altura;
- alteração sutil de contraste;
- microinterações nos itens.

Não ocultar completamente o menu durante a navegação.

## 9. Navegação híbrida

Criar dois sistemas complementares.

### 9.1 Menu institucional

O menu superior fixo deve continuar direcionando para as páginas internas reais do portal.

Cada página deve continuar possuindo sua própria rota e URL.

### 9.2 Navegação por capítulos da home

A página inicial deve possuir uma navegação visual própria para seus capítulos.

Essa navegação pode utilizar:

- numeração;
- títulos curtos;
- marcador lateral;
- indicador de progresso;
- linha de avanço;
- pequenos controles;
- estado ativo conforme o scroll.

Os capítulos devem ser derivados exclusivamente das seções e informações existentes na home.

Não criar novos conteúdos institucionais apenas para preencher a navegação.

A navegação por capítulos deve orientar o usuário dentro da página inicial, sem substituir o menu institucional.

## 10. Página inicial

A home deve funcionar como uma apresentação institucional imersiva da LAMTUE.

A primeira tela deve comunicar rapidamente:

- identidade da Liga;
- propósito;
- área de atuação;
- relevância acadêmica;
- principais caminhos de navegação.

Após o hero, organize os conteúdos existentes como capítulos visuais conectados.

As informações detalhadas devem continuar disponíveis nas páginas internas correspondentes.

Preserve e valorize especialmente:

- apresentação institucional;
- pilares;
- atividades;
- projetos;
- processo seletivo;
- diretoria;
- demais seções já existentes.

## 11. Hero principal

O hero deve concentrar o maior impacto visual.

Utilize:

- composição em camadas;
- movimento ambiental lento;
- tipografia marcante;
- assimetria controlada;
- espaço negativo;
- profundidade;
- elementos gráficos derivados da identidade da LAMTUE;
- um foco visual principal;
- indicação clara de continuidade.

Evitar:

- excesso de textos;
- muitos botões concorrentes;
- diversos cards;
- múltiplos objetos disputando atenção;
- animações rápidas ou agressivas.

O hero deve apresentar primeiro a LAMTUE, antes de destacar informações secundárias.

## 12. Scrollytelling e movimento

O movimento deve participar da estrutura narrativa da home.

O scroll pode controlar moderadamente:

- revelação progressiva;
- mudanças de profundidade;
- deslocamento de camadas;
- aproximação e afastamento;
- iluminação;
- foco;
- escala;
- opacidade;
- passagem entre capítulos;
- indicadores de progresso;
- transformação de elementos gráficos.

As transições devem criar sensação de continuidade.

Sempre que fizer sentido, um elemento pode permanecer parcialmente visível, deslocar-se ou transformar-se para conduzir ao capítulo seguinte.

Não utilizar o mesmo fade genérico em todas as seções.

Não bloquear ou sequestrar o scroll.

O usuário deve continuar tendo controle imediato sobre a navegação.

## 13. Profundidade 2.5D

Criar profundidade por meio de:

- camadas;
- parallax discreto;
- sobreposição controlada;
- variações suaves de escala;
- diferentes velocidades de movimento;
- recortes pelas bordas;
- mudanças de nitidez;
- iluminação localizada.

Separar visualmente:

- plano de fundo;
- elementos ambientais;
- foco visual;
- textos;
- elementos de interface.

Evitar modelos 3D pesados ou objetos tridimensionais sem função.

Priorizar soluções leves com CSS, SVG, imagens existentes e animações otimizadas.

## 14. Composição dos capítulos

Cada capítulo deve possuir:

- hierarquia clara;
- um foco visual dominante;
- título forte;
- texto legível;
- relação evidente com o conteúdo;
- transição coerente com o capítulo anterior e o seguinte.

Evitar estruturar toda a home como uma sequência de grades iguais.

Alternar composições quando adequado:

- texto à esquerda e imagem à direita;
- imagem parcialmente recortada;
- conteúdo deslocado do centro;
- título ocupando área ampla;
- sobreposição controlada;
- áreas de respiro.

A assimetria não pode comprometer leitura ou responsividade.

## 15. Elementos técnicos e ambientais

Podem ser utilizados discretamente:

- linhas;
- pontos;
- grades;
- trajetórias;
- conexões;
- pulsos;
- círculos concêntricos;
- indicadores;
- numeração;
- marcadores;
- geometrias abstratas;
- pequenos dados contextuais.

Esses elementos devem sugerir:

- fluxo;
- protocolo;
- monitoramento;
- integração;
- resposta rápida;
- organização.

Utilizar poucos elementos por seção.

Não usar:

- moléculas aleatórias;
- ilustrações médicas genéricas;
- anatomia decorativa sem função;
- excesso de partículas;
- elementos que cubram textos ou botões.

## 16. Cards e componentes

Não transformar todas as seções em cards.

Utilizar cards apenas quando forem necessários para organizar conteúdos comparáveis.

Quando utilizados, podem receber:

- bordas sutis;
- profundidade;
- iluminação localizada;
- transparência moderada;
- microinterações;
- variações coerentes de tamanho.

Evitar:

- glassmorphism genérico;
- blur intenso;
- transparência excessiva;
- sombras artificiais;
- cantos excessivamente arredondados;
- repetição do mesmo componente em toda a home.

## 17. Animações de entrada

Coordenar a entrada de:

- títulos;
- textos;
- imagens;
- botões;
- cards;
- elementos técnicos.

Podem ser utilizados:

- deslocamentos curtos;
- blur inicial discreto;
- máscaras de revelação;
- mudanças suaves de escala;
- entradas sequenciais;
- opacidade;
- profundidade.

As animações devem ser rápidas o suficiente para não atrasar a leitura.

Não esconder informações importantes por períodos prolongados.

## 18. Loader inicial com ECG

Criar uma tela de carregamento inicial em tela cheia.

Ela deve aparecer:

- no primeiro acesso;
- em recarregamento completo da aplicação;
- enquanto os recursos críticos da interface são preparados.

O loader deve conter:

- identidade visual da LAMTUE;
- logotipo preservado;
- percentual de 0% a 100%;
- linha animada simulando eletrocardiograma;
- fundo derivado da paleta atual;
- transição final para o hero.

### Funcionamento técnico

A animação deve possuir duração mínima de 3 segundos.

O percentual deve ser visualmente sincronizado ao carregamento real:

1. acompanhar a preparação dos recursos críticos;
2. progredir suavemente;
3. não atingir 100% antes de o conteúdo essencial estar pronto;
4. poder permanecer próximo de 90% ou 95% enquanto aguarda;
5. concluir em 100% quando o tempo mínimo e o carregamento real forem finalizados;
6. liberar o site somente após as duas condições.

Não utilizar apenas um temporizador desconectado do estado real.

O carregamento deve parecer contínuo, sem saltos bruscos.

Ao atingir 100%:

- executar um último pulso do ECG;
- realizar uma transição curta;
- revelar o hero já renderizado;
- não mostrar conteúdo incompleto ou troca tardia de fontes.

Não reproduzir sons automaticamente.

## 19. Transições entre páginas

Ao clicar em um item do menu que leve a outra página, não executar recarregamento completo do navegador.

Utilizar o sistema de rotas interno já existente no projeto.

A navegação deve funcionar como aplicação SPA:

1. o usuário clica no item;
2. uma transição visual curta é iniciada;
3. o conteúdo da próxima rota é preparado;
4. a URL é atualizada normalmente;
5. o conteúdo atual é substituído;
6. a nova página é exibida;
7. não ocorre flash branco ou recarregamento completo.

Preservar:

- URLs próprias;
- histórico do navegador;
- botão voltar;
- botão avançar;
- acesso por link direto;
- possibilidade de compartilhar páginas;
- comportamento correto de SEO conforme a tecnologia existente.

Não utilizar para navegação interna, quando o framework possuir roteamento apropriado:

- `window.location`;
- `location.href`;
- `reload()`.

### Aparência da transição

A transição interna deve ser uma versão curta da identidade do loader inicial.

Pode utilizar:

- fundo da paleta atual;
- linha de ECG;
- pulso;
- máscara de passagem;
- pequena indicação de atividade.

Não repetir o carregamento completo de 0% a 100% em cada navegação.

A transição deve ser curta e não parecer que o site está demorando artificialmente.

A nova página deve iniciar no topo, exceto quando o comportamento esperado for restaurar a posição anterior pelo histórico do navegador.

## 20. Páginas internas

As páginas internas devem preservar a mesma identidade do redesign, mas ser mais objetivas que a home.

Utilizar:

- menu fixo;
- cabeçalhos visuais consistentes;
- tipografia e componentes do novo sistema;
- animações curtas;
- transições internas;
- hierarquia institucional clara;
- boa legibilidade.

Reduzir nas páginas internas:

- parallax;
- partículas;
- efeitos ambientais;
- transições longas;
- profundidade excessiva.

Não transformar páginas de leitura, documentos ou informações institucionais em experiências difíceis de consultar.

## 21. Microinterações

Aplicar respostas suaves a:

- botões;
- links;
- itens do menu;
- ícones;
- indicadores;
- cards clicáveis;
- elementos de navegação.

Utilizar pequenas alterações de:

- escala;
- posição;
- preenchimento;
- brilho;
- borda;
- opacidade;
- espessura de linha.

As respostas devem ser rápidas, discretas e precisas.

## 22. Responsividade

O layout deve ser desenvolvido e testado para:

- desktop;
- notebook;
- tablet;
- celular.

No celular:

- reorganizar as composições;
- reduzir parallax;
- reduzir partículas;
- reduzir blur;
- simplificar movimentos em profundidade;
- adaptar a navegação por capítulos;
- preservar o menu institucional;
- evitar elementos fixos excessivos;
- manter todo o conteúdo acessível;
- preservar todas as funcionalidades.

A versão mobile não deve ser apenas a versão desktop reduzida.

## 23. Acessibilidade

Respeitar `prefers-reduced-motion`.

Quando a redução de movimento estiver ativa:

- remover parallax;
- eliminar movimentos ambientais contínuos;
- simplificar o ECG;
- substituir transições complexas por fades curtos;
- manter o conteúdo imediatamente disponível;
- não exigir animação para compreender a interface.

Garantir:

- contraste;
- foco visível;
- navegação por teclado;
- textos alternativos existentes;
- semântica;
- áreas clicáveis adequadas;
- leitura correta por tecnologias assistivas;
- menu acessível;
- loader que não prenda o usuário indefinidamente.

## 24. Desempenho

Priorizar a tecnologia e as dependências já existentes no projeto.

Antes de adicionar uma biblioteca, verifique se o projeto já possui recurso equivalente.

Evitar:

- bibliotecas pesadas desnecessárias;
- WebGL sem necessidade;
- modelos 3D complexos;
- vídeos pesados em autoplay;
- partículas em excesso;
- animações que provoquem layout shift;
- múltiplos listeners de scroll não otimizados.

Utilizar quando adequado:

- CSS;
- SVG;
- `transform`;
- `opacity`;
- `requestAnimationFrame`;
- lazy loading;
- preload apenas de recursos críticos;
- otimização de imagens;
- code splitting existente;
- cleanup correto de efeitos e listeners.

As animações devem priorizar propriedades aceleradas por GPU e evitar reflows contínuos.

## 25. Restrições obrigatórias

Não:

- alterar conteúdo;
- mudar a paleta;
- trocar o logotipo;
- inventar novas informações;
- remover páginas;
- quebrar links;
- alterar regras de negócio;
- modificar o banco de dados;
- substituir integrações;
- implementar o formulário de novos ligantes;
- publicar a versão;
- alterar a branch principal;
- fazer merge;
- realizar refatorações sem relação direta com o layout;
- copiar literalmente outro site;
- comprometer acessibilidade em favor de animação;
- deixar código incompleto ou apenas conceitual.

## 26. Critérios de conclusão

Considere a tarefa concluída apenas quando:

- a worktree isolada estiver criada ou confirmada;
- a branch exclusiva estiver ativa;
- a versão original permanecer intacta;
- o novo layout estiver implementado;
- a home possuir apresentação visual por capítulos;
- o menu institucional estiver fixo;
- as páginas internas continuarem acessíveis;
- as rotas funcionarem sem recarregamento completo;
- o loader inicial funcionar de 0% a 100%;
- o loader respeitar o mínimo de 3 segundos e o carregamento real;
- a linha de ECG estiver sincronizada visualmente;
- as transições internas funcionarem;
- o conteúdo existente estiver preservado;
- desktop e celular estiverem funcionais;
- `prefers-reduced-motion` estiver tratado;
- build, lint e testes disponíveis forem concluídos;
- não houver erros relevantes no console;
- nenhuma alteração tiver sido publicada.

## 27. Entrega final

Ao concluir, apresente um relatório objetivo contendo:

1. nome e caminho da worktree criada ou utilizada;
2. branch utilizada;
3. resumo do novo layout;
4. principais componentes criados ou modificados;
5. arquivos alterados;
6. funcionamento do loader inicial;
7. funcionamento das transições entre páginas;
8. comportamento responsivo;
9. tratamento de acessibilidade;
10. comandos de build e testes executados;
11. resultados dos testes;
12. eventuais limitações técnicas encontradas;
13. instrução exata para executar e visualizar essa variação localmente.

Não faça deploy, push ou merge.
