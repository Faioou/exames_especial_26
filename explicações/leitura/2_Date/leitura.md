# Página 33

Em termos de bases de dados e linguagens de programação, o termo **"commalist"** refere-se a uma sequência de um ou mais elementos de um determinado tipo (neste caso, nomes de atributos ou outros elementos sintáticos) em que cada par de elementos adjacentes é separado por uma vírgula. 

### Explicação mais detalhada:
- O **xyz** na explicação refere-se a qualquer estrutura sintática, como "nome de atributo". Em bases de dados, os **nomes de atributos** são os nomes das colunas de uma tabela.
- Uma **commalist** de nomes de atributos consiste numa lista de nomes de atributos separados por vírgulas. 
- Podem existir espaços antes ou depois das vírgulas, mas esses espaços não têm significado.
- Exemplos fornecidos na imagem incluem:
  - **A, B, C** — Esta é uma lista de três atributos.
  - **C, A, B** — Outra lista com os mesmos atributos, mas em ordem diferente.
  - **B** — Uma lista com apenas um atributo.
  - **A, C** — Uma lista com dois atributos.

Adicionalmente, a sequência **vazia** de nomes de atributos também é considerada uma **commalist válida**.

### Resumo:
Em termos práticos numa base de dados, uma **commalist** é simplesmente uma lista de atributos que podem ser usados em consultas SQL, como:

```sql
SELECT A, B, C FROM Tabela;
```

Aqui, **A, B, C** é um exemplo de uma **commalist** de atributos da tabela. 

---

# Página 34

Sim, **{SNO, PNO}** é uma chave composta nesse exemplo de **Shipments**.

### Explicação detalhada:

No exemplo dado:
- A tabela (ou **relvar** no jargão relacional) **SP** contém os envios de partes (shipments) e regista qual fornecedor (**SNO**) forneceu qual parte (**PNO**), juntamente com a quantidade enviada (**QTY**).
- A combinação de **SNO** (número do fornecedor) e **PNO** (número da parte) é **única** para cada registo, o que significa que para qualquer fornecedor e parte específicos, há apenas um envio (shipment) registado num dado momento.

### O que isto implica:
- Nem **SNO** (número do fornecedor) nem **PNO** (número da parte), individualmente, são suficientes para identificar unicamente cada registo na tabela.
- **SNO** sozinho não é único, porque o mesmo fornecedor pode enviar várias partes.
- **PNO** sozinho também não é único, porque a mesma parte pode ser enviada por vários fornecedores.

### A chave composta:
- A combinação de **SNO** e **PNO** é única, o que significa que o par de valores {**SNO, PNO**} pode ser usado para identificar unicamente cada registo na tabela **Shipments**.
- Assim, a chave primária é composta pelos dois atributos: **{SNO, PNO}**, formando uma **chave composta**.

### Exemplo em SQL:

```sql
CREATE TABLE Shipments (
    SNO INT,        -- Número do fornecedor
    PNO INT,        -- Número da parte
    QTY INT,        -- Quantidade enviada
    PRIMARY KEY (SNO, PNO)  -- Chave composta
);
```

Neste exemplo, a chave composta **{SNO, PNO}** garante que não haverá dois registos com a mesma combinação de fornecedor e parte.

### Porque é importante:
- A **chave composta** neste caso assegura que para qualquer fornecedor e parte específicos, só há um envio registado num determinado momento. É uma forma eficaz de garantir unicidade numa tabela onde nenhum dos atributos, isoladamente, consegue garantir isso.

--- 

# Página 49

A imagem trata de dois conceitos centrais em bases de dados relacionais: **relation values** (valores de relações) e **relation variables** (variáveis de relação), e explora a distinção lógica entre eles, utilizando o exemplo dos **Shipments** (envios). Vou explicar em detalhe cada um destes conceitos com base no que está representado e escrito.

### 1. Diferença entre **Relation Values** e **Relation Variables**:

- **Relation Values** (**valores de relação**): Estes são os **dados** concretos que estão presentes numa relação em determinado momento. Em termos simples, representam o **conteúdo** atual de uma tabela. No exemplo dado, o valor da relação seria o conjunto de linhas (tuplas) que indicam que um determinado fornecedor enviou uma certa parte em uma determinada quantidade.

  Exemplo:
  - No tempo **T1**, os valores da relação na tabela **SP** (Shipments) são:
    - O fornecedor **S1** forneceu a parte **P1** em quantidade 300.
    - O fornecedor **S2** forneceu a parte **P1** em quantidade 300.
  - Estes são os valores atuais dessa relação **neste ponto no tempo**.

- **Relation Variables** (**variáveis de relação**): Estas referem-se à **estrutura** que contém os dados, ou seja, são as **tabelas** que podem ser **alteradas ao longo do tempo**. Ao contrário dos valores, que representam os dados específicos num dado momento, a variável de relação refere-se ao próprio objeto (a tabela) que pode ter diferentes valores em diferentes momentos.

  Exemplo:
  - A **variável de relação** **SP** é a própria tabela de Shipments, que pode conter diferentes dados em diferentes momentos.
  - No tempo **T2**, a tabela **SP** contém um novo valor adicional:
    - O fornecedor **S1** forneceu a parte **P2** em quantidade 200.
  - Então, a **variável de relação** continua a ser a mesma (a tabela **SP**), mas o **valor** da relação mudou porque foi inserida uma nova linha (tupla) à tabela.

### 2. Explicação do Exemplo:
No diagrama, podes ver uma tabela de envios (**Shipments**), onde a relação envolve os fornecedores (**SNO**), as partes fornecidas (**PNO**) e a quantidade fornecida (**QTY**). 

- **À esquerda**, a tabela **SP** no tempo **T1** contém duas tuplas (registos):
  - O fornecedor **S1** forneceu a parte **P1** em quantidade 300.
  - O fornecedor **S2** forneceu a parte **P1** em quantidade 300.
  
  Estes são os valores da relação na tabela **SP** nesse momento específico, no tempo **T1**. Aqui, estamos a falar dos **dados** que estavam na tabela naquele momento.

- **À direita**, no tempo **T2**, foi adicionada uma nova tupla:
  - O fornecedor **S1** forneceu a parte **P2** em quantidade 200.
  
  Assim, o valor da relação mudou com a inserção de um novo registo, mas a **variável de relação** (a tabela **SP**) continua a ser a mesma, apenas com dados diferentes.

### 3. Terminologia usada:
- O texto refere que a comunidade de bases de dados muitas vezes usou a palavra **relation** (relação) tanto para referir-se a **relation values** (valores da relação) como a **relation variables** (variáveis de relação), o que pode gerar confusão. Por isso, o autor sugere usar uma distinção clara:
  - **relation value** (valor de relação) para o conteúdo real da tabela num dado momento (as tuplas, ou registos).
  - **relation variable** (variável de relação), abreviada como **relvar**, para a tabela em si que pode mudar ao longo do tempo.

### 4. Conclusão do exemplo:
- A relação **SP** (Shipments) é uma **variável de relação** (ou **relvar**), que no tempo **T1** tem um certo conjunto de valores (as duas primeiras tuplas), e no tempo **T2** contém um conjunto de valores diferente (com a adição de uma nova tupla).
  
- A tabela **SP** continua a ser a mesma **variável de relação**, mas os **valores da relação** mudam ao longo do tempo conforme os dados vão sendo atualizados.

### Resumo:
- Uma **variável de relação** é uma tabela, ou seja, a estrutura onde os dados são armazenados.
- Um **valor de relação** refere-se aos dados concretos presentes na tabela num dado momento.
- No exemplo, a tabela **SP** (Shipments) é a **variável de relação**, e as combinações de **SNO, PNO, QTY** que estão presentes na tabela em diferentes momentos são os **valores da relação**.

---

# Página 50

O trecho fala sobre o **Princípio da Intercambialidade** (Principle of Interchangeability) entre **vistas** (views) e **variáveis de relação base** (base relvars). Para explicar isso em termos simples e usando o exemplo anterior de **Shipments**, vamos destrinçar cada parte.

### 1. **Base Relvars e Views**:
- **Base Relvars** (ou variáveis de relação base): São as **tabelas reais** que armazenam os dados no sistema de base de dados. No exemplo de **Shipments** que vimos anteriormente, a tabela **SP** é uma **base relvar**, contendo as tuplas (linhas de dados) que correspondem aos envios de partes por fornecedores.

- **Views** (ou vistas): São **tabelas virtuais** que não armazenam dados por si mesmas, mas são **definidas** a partir de **base relvars** ou outras views. As views geralmente servem para simplificar o acesso aos dados ou fornecer uma visão personalizada dos dados sem modificar diretamente as tabelas base.

  **Exemplo de uma view**: Imagina que queres criar uma **view** para ver apenas os envios de um determinado fornecedor, digamos o fornecedor **S1**. Podes criar uma view assim:

  ```sql
  CREATE VIEW Shipments_S1 AS
  SELECT SNO, PNO, QTY
  FROM Shipments
  WHERE SNO = 'S1';
  ```

  Esta view **Shipments_S1** não é uma tabela "real" no sentido de armazenar fisicamente os dados, mas mostra ao utilizador os envios do fornecedor **S1**, como se fosse uma tabela. Os dados vêm da **tabela base** **Shipments**.

### 2. **Princípio da Intercambialidade**:

O princípio afirma que, **do ponto de vista do utilizador**, **views** e **base relvars** devem **parecer e comportar-se da mesma maneira**. Ou seja, a pessoa que usa a base de dados não precisa saber se está a trabalhar diretamente com uma tabela real (base relvar) ou com uma vista (view). Ambos devem parecer iguais.

- **Views** devem funcionar como se fossem tabelas "reais", permitindo ao utilizador consultá-las, filtrá-las, e, em alguns casos, até modificar os dados (dependendo do sistema de base de dados e de como a view é criada).

### 3. **Exemplo com Shipments**:

Imagina que o utilizador está a trabalhar com a **tabela base** **Shipments** no tempo **T1**:

```plaintext
SNO  PNO  QTY
S1   P1   300
S2   P1   300
```

Agora, o mesmo utilizador também está a usar a **view** **Shipments_S1** (aquela que criámos para mostrar apenas os envios do fornecedor **S1**). A view vai apresentar:

```plaintext
SNO  PNO  QTY
S1   P1   300
```

O importante é que, do ponto de vista do utilizador, **Shipments_S1** parece uma tabela como qualquer outra, mesmo que seja derivada da tabela base **Shipments**. O utilizador não se importa se os dados vêm diretamente da tabela base ou de uma vista; para ele, a experiência é a mesma. Esse é o **Princípio da Intercambialidade**.

### 4. **Vistas como isolamento do "mundo real"**:

O texto refere que algumas **views** são usadas para **isolar o utilizador** da complexidade do "mundo real" da base de dados. Isso significa que, em vez de interagir diretamente com tabelas complicadas (com muitos campos ou relações complexas), o utilizador pode usar **views** simplificadas que mostram apenas a informação relevante.

Voltando ao exemplo: 
- A view **Shipments_S1** esconde a complexidade de todos os envios que estão na tabela base **Shipments**, mostrando apenas os dados relevantes sobre o fornecedor **S1**.

### 5. **Aplicação dos princípios de design**:

O texto também menciona que os princípios de design de base de dados, como a **normalização** (um processo que organiza as tabelas para minimizar redundâncias), **aplicam-se tanto a bases de dados com apenas relvars base, como a bases de dados que incluem views**. Em outras palavras, quando desenhas uma base de dados, tanto as **base relvars** como as **views** devem seguir os mesmos princípios de boas práticas de design.

### 6. **Uso do termo "relvar"**:

Finalmente, o autor diz que, ao longo do livro, vai usar o termo **relvar** de forma geral, e o contexto indicará se ele está a referir-se a **variáveis de relação base** (tabelas reais) ou a **views**. Em ambos os casos, as **views** são tratadas como se fossem **relvars** reais, respeitando o princípio de que o utilizador não deve notar a diferença entre elas e as tabelas base.

### Resumo:

- **Base relvars** são as tabelas reais que armazenam dados.
- **Views** são tabelas virtuais derivadas das **base relvars**, mas que se comportam como tabelas reais do ponto de vista do utilizador.
- O **Princípio da Intercambialidade** garante que, para o utilizador, views e tabelas reais devem parecer e funcionar da mesma maneira.
- Este princípio permite que os utilizadores interajam com a base de dados sem precisar de saber se estão a trabalhar com uma view ou com uma tabela real.
- Os princípios de design de base de dados, como normalização, aplicam-se tanto a tabelas reais como a views.

---

# Página 51

O texto aborda dois conceitos importantes em bases de dados relacionais: **degree** (grau) e **cardinality** (cardinalidade). Vou explicar estes conceitos em português de Portugal com base no exemplo dos **Shipments** (envios), para facilitar o entendimento de quem não conhece nada sobre o tema.

### 1. **Degree (Grau)**:

O **grau** refere-se ao **número de atributos** (ou colunas) que uma relação, ou tabela, possui.

- No exemplo de **Shipments**, a tabela **SP** tem três atributos:
  - **SNO** (número do fornecedor)
  - **PNO** (número da parte fornecida)
  - **QTY** (quantidade fornecida)
  
  Portanto, o **grau** da tabela **SP** é **3**, porque tem três colunas.

#### Grau aplicado a chaves e chaves estrangeiras:
- O conceito de **grau** também se aplica a **chaves** (ou **keys**). 
- No exemplo, a chave primária da tabela **SP** é composta pelos atributos **SNO** e **PNO**. Como esta chave é composta por **dois** atributos, o seu grau é **2**. 
- Além disso, cada uma das **chaves estrangeiras** da tabela também tem um grau. Neste caso, tanto **SNO** (referindo-se à tabela de fornecedores) como **PNO** (referindo-se à tabela de partes) têm grau **1** porque são formadas por um único atributo.

### 2. **Cardinality (Cardinalidade)**:

A **cardinalidade** refere-se ao **número de tuplas (ou linhas)** que estão presentes no corpo da relação ou tabela num dado momento. É, basicamente, o **número de registos** que uma tabela contém.

- Por exemplo, se a tabela **Shipments** tiver as seguintes tuplas:

  | SNO  | PNO  | QTY |
  |------|------|-----|
  | S1   | P1   | 300 |
  | S2   | P1   | 300 |
  | S1   | P2   | 200 |

  Neste caso, a **cardinalidade** da tabela **SP** é **3**, porque a tabela tem **três linhas (tuplas)**.

### 3. Grau em mais detalhe:
- O grau de uma tabela (ou de uma relação) pode ser **qualquer número inteiro não negativo**. Quando uma tabela tem:
  - **Grau 1**, é chamada de **unária** (tabela com apenas um atributo).
  - **Grau 2**, é chamada de **binária** (tabela com dois atributos).
  - **Grau 3**, é chamada de **ternária** (tabela com três atributos).
  
  Mais genericamente, uma tabela com **grau n** é dita **n-ária**.

### Exemplo prático com **Shipments**:
- No caso da tabela **SP** (Shipments):
  - O **grau** é **3** (porque tem três atributos: **SNO**, **PNO**, **QTY**).
  - A **chave primária** **{SNO, PNO}** tem grau **2** (porque é composta por dois atributos).
  - Cada chave estrangeira, **SNO** e **PNO**, tem grau **1** (porque são formadas por um único atributo).
  - A **cardinalidade** da tabela depende do número de tuplas (registos) que ela contém num dado momento. No exemplo acima, a cardinalidade é **3** porque há três linhas.

### Resumo:

- O **grau** de uma tabela refere-se ao número de atributos (colunas). No caso de **Shipments**, o grau é 3.
- A **cardinalidade** refere-se ao número de tuplas (linhas) numa tabela. No exemplo, a cardinalidade da tabela é 3.
- Chaves (primárias e estrangeiras) também têm graus, que dependem do número de atributos que as compõem.

---

# Página 52 e 53 

### Explicação de *Predicates* e *Propositions* em português com base no exemplo dos **Shipments**:

Em bases de dados relacionais, os conceitos de **predicados** (*predicates*) e **proposições** (*propositions*) são fundamentais para entender a representação de dados e como estes se relacionam com o mundo real.

#### 1. **Predicates (Predicados)**:

Um **predicado** pode ser entendido como uma **declaração genérica** sobre o mundo real, que descreve uma situação ou condição que a tabela (ou variável de relação) está a representar. No exemplo da tabela **Shipments** (SP), o predicado descreve a relação entre os fornecedores, as partes fornecidas e a quantidade fornecida. 

O predicado para a tabela **SP** pode ser expresso da seguinte forma:

- **Predicado**: **O fornecedor SNO fornece a parte PNO na quantidade QTY.**

Este predicado é uma **afirmação genérica** que serve para descrever o propósito da tabela **SP**. Ele é **parametrizado** pelos atributos **SNO**, **PNO** e **QTY**. Isso significa que a tabela contém instâncias concretas desses parâmetros (ou variáveis), que se traduzem em linhas (tuplas) específicas na tabela.

#### 2. **Propositions (Proposições)**:

Uma **proposição** é uma **afirmação específica** que pode ser verdadeira ou falsa, baseada nos dados concretos que a tabela contém em um dado momento. Ou seja, cada linha na tabela **SP** representa uma **proposição** que corresponde a uma instância específica do predicado genérico.

Vamos ver alguns exemplos práticos baseados na tabela **Shipments**:

#### Exemplo prático:

Imaginemos que temos os seguintes dados na tabela **Shipments (SP)**:

| **SNO** | **PNO** | **QTY** |
|---------|---------|---------|
| S1      | P1      | 300     |
| S2      | P1      | 300     |
| S1      | P2      | 200     |

Neste caso, o **predicado genérico** continua a ser:
- **O fornecedor SNO fornece a parte PNO na quantidade QTY.**

Agora, com base nos dados da tabela, podemos derivar **proposições concretas**. Cada linha na tabela é uma **proposição** que representa uma instância do predicado:

- **Proposição 1**: O fornecedor **S1** fornece a parte **P1** na quantidade **300**.
- **Proposição 2**: O fornecedor **S2** fornece a parte **P1** na quantidade **300**.
- **Proposição 3**: O fornecedor **S1** fornece a parte **P2** na quantidade **200**.

Cada uma destas proposições pode ser avaliada como **verdadeira** ou **falsa** com base nos dados na tabela. Se os dados da tabela estiverem corretos, então todas estas proposições são verdadeiras no contexto da base de dados.

#### Diferença entre **Predicate** e **Proposition**:

- O **predicado** é a **declaração genérica** que define a estrutura da relação (tabela), ou seja, a forma como os dados estão organizados e o que eles representam.
- As **proposições** são as **declarações específicas** que resultam da aplicação do predicado aos dados concretos na tabela. Cada linha da tabela representa uma proposição que pode ser avaliada como verdadeira ou falsa.

#### 3. Mais sobre o conceito de **Predicate**:

O texto menciona que o termo **predicado** tem um uso comum em linguagens de programação e SQL, onde refere-se a expressões que resultam em valores booleanos (verdadeiro ou falso). No entanto, no contexto de bases de dados relacionais, o termo **predicado** tem um significado mais geral e importante: ele descreve uma **afirmação parametrizada** sobre o mundo real.

Por exemplo, o predicado **"O fornecedor SNO fornece a parte PNO na quantidade QTY"** é independente da linguagem em que é expresso. Pode ser dito em inglês, português, ou qualquer outra língua, mas a sua essência permanece a mesma: é uma afirmação parametrizada que espera valores concretos para SNO, PNO e QTY.

#### 4. Predicados e Interpretação:

A interpretação de um predicado é como traduzimos a estrutura de dados (a tabela **SP**) numa afirmação sobre o mundo real. Neste exemplo, o predicado diz respeito à relação entre fornecedores, partes e quantidades, mas este mesmo conceito pode ser aplicado a qualquer tabela numa base de dados.

#### Resumo Final:

- Um **predicado** é uma **declaração genérica e parametrizada** sobre os dados que uma tabela representa. No exemplo da tabela **SP** de **Shipments**, o predicado é "O fornecedor SNO fornece a parte PNO na quantidade QTY".
- Uma **proposição** é uma **declaração específica** baseada nos valores reais da tabela. Cada linha (ou tupla) na tabela **Shipments** é uma proposição concreta, como "O fornecedor S1 fornece a parte P1 na quantidade 300".
- Predicados e proposições ajudam a ligar a estrutura da base de dados (as tabelas) ao mundo real, permitindo-nos fazer afirmações que podem ser avaliadas como verdadeiras ou falsas.

---

# Página 55

O trecho que forneces está a apresentar uma explicação sobre a base de dados de **fornecedores e partes** (suppliers and parts) no contexto do modelo relacional, utilizando um exemplo de uma linguagem chamada **Tutorial D**. Vou explicar isso em português de Portugal, lembrando o exemplo de **Shipments** e com foco nos conceitos principais.

### 1. Definição dos Relvars na Base de Dados:

No exemplo da base de dados de **fornecedores** e **partes** (suppliers and parts), temos três **variáveis de relação** ou **relvars**, que são as tabelas da base de dados. Elas são definidas de forma semelhante ao que já vimos para o relvar **SP** (Shipments), mas agora estamos a incluir informações adicionais para definir como as tabelas estão estruturadas e interligadas.

#### 1.1. Relvar **S** - Fornecedores (Suppliers):

```plaintext
VAR S BASE RELATION
{
  SNO CHAR,         -- Número do fornecedor
  SNAME CHAR,       -- Nome do fornecedor
  STATUS INTEGER,   -- Estado (ou classificação) do fornecedor
  CITY CHAR         -- Cidade do fornecedor
}
KEY { SNO };
```

Esta definição refere-se à tabela **S**, que armazena informações sobre **fornecedores**. Cada fornecedor tem um:
- **SNO**: Número do fornecedor (chave primária).
- **SNAME**: Nome do fornecedor.
- **STATUS**: Estado ou classificação do fornecedor (provavelmente para indicar se o fornecedor está ativo ou inativo).
- **CITY**: Cidade onde o fornecedor está localizado.

A **chave primária** (KEY) é o atributo **SNO**. Ou seja, cada fornecedor tem um número único (**SNO**) que o identifica.

#### 1.2. Relvar **P** - Partes (Parts):

```plaintext
VAR P BASE RELATION
{
  PNO CHAR,         -- Número da parte
  PNAME CHAR,       -- Nome da parte
  COLOR CHAR,       -- Cor da parte
  WEIGHT RATIONAL,  -- Peso da parte (número racional)
  CITY CHAR         -- Cidade onde a parte é fabricada
}
KEY { PNO };
```

Aqui temos a definição da tabela **P**, que armazena informações sobre as **partes** fornecidas:
- **PNO**: Número da parte (chave primária).
- **PNAME**: Nome da parte.
- **COLOR**: Cor da parte.
- **WEIGHT**: Peso da parte (representado como um número racional, ou seja, pode incluir frações).
- **CITY**: Cidade onde a parte é fabricada ou armazenada.

A **chave primária** (KEY) é o atributo **PNO**, ou seja, cada parte tem um número único que a identifica.

#### 1.3. Relvar **SP** - Shipments (Envios):

```plaintext
VAR SP BASE RELATION
{
  SNO CHAR,         -- Número do fornecedor
  PNO CHAR,         -- Número da parte
  QTY INTEGER       -- Quantidade enviada
}
KEY { SNO, PNO }
FOREIGN KEY { SNO } REFERENCES S
FOREIGN KEY { PNO } REFERENCES P;
```

Agora, temos a tabela **SP**, que é a mesma que vimos anteriormente no exemplo de **Shipments**. Esta tabela armazena os envios de partes por fornecedores:
- **SNO**: Número do fornecedor (que corresponde ao número do fornecedor da tabela **S**).
- **PNO**: Número da parte (que corresponde ao número da parte na tabela **P**).
- **QTY**: Quantidade enviada.

Aqui, a **chave primária** é composta por **SNO** e **PNO** (uma **chave composta**), o que significa que cada combinação de fornecedor e parte é única na tabela. Ou seja, o mesmo fornecedor não pode enviar a mesma parte mais de uma vez sem criar um novo registo.

Além disso, são definidas **chaves estrangeiras**:
- **SNO** é uma **chave estrangeira** que refere-se à tabela **S** (fornecedores).
- **PNO** é uma **chave estrangeira** que refere-se à tabela **P** (partes).

Estas chaves estrangeiras garantem que as partes e os fornecedores utilizados na tabela **SP** realmente existam nas tabelas **S** e **P**, respetivamente.

### 2. Sobre a Linguagem **Tutorial D**:

A linguagem usada para definir estas tabelas é chamada **Tutorial D**, que é uma linguagem relacional idealizada para ensinar e exemplificar conceitos de bases de dados relacionais. No entanto, a definição que mostras é bastante clara e autoexplicativa. É semelhante a outras linguagens de definição de dados, como SQL, mas com uma sintaxe diferente.

O autor menciona o **Terceiro Manifesto** (**The Third Manifesto**), que é um documento formal que define o modelo relacional e uma teoria de tipos subjacente, incluindo conceitos como herança de tipos, utilizados no desenvolvimento de bases de dados relacionais. Este manifesto defende a pureza e precisão no uso de conceitos relacionais e a sua implementação correta.

### 3. Resumo Final:

- **S** é a tabela de fornecedores, com **SNO** (número do fornecedor) como chave primária.
- **P** é a tabela de partes, com **PNO** (número da parte) como chave primária.
- **SP** é a tabela que relaciona os fornecedores e as partes (envios), onde cada combinação de **SNO** e **PNO** é única (chave composta). Além disso, **SNO** e **PNO** são chaves estrangeiras que se referem às tabelas **S** e **P**, respetivamente.

As definições destas tabelas em **Tutorial D** são usadas para demonstrar como estruturar uma base de dados relacional, garantindo que as relações entre fornecedores, partes e envios sejam consistentes e que os dados sejam corretamente interligados através de chaves primárias e estrangeiras.

---

# Página 56 e 57

Vamos analisar este texto em português de Portugal, com uma explicação detalhada e exemplos para quem está a aprender sobre bases de dados relacionais.

### 1. **Chave (KEY) e Restrição de Chave (Key Constraint)**

O texto começa por falar das **definições dos relvars** (tabelas ou variáveis de relação) e, mais especificamente, da definição de **chaves** em cada um desses relvars. Em bases de dados relacionais, **cada relvar tem pelo menos uma chave**, e essa chave serve para garantir que cada tupla (linha) na tabela é **única**. Isso é chamado de **restrição de chave**.

#### Exemplo no Relvar **S** (Fornecedores):

Na tabela **S**, que armazena os dados dos fornecedores, a chave primária é o atributo **SNO** (número do fornecedor). Isto significa que:

- **Nenhuma tupla (linha) na tabela pode ter o mesmo valor de SNO que outra tupla**.
- Ou seja, dois fornecedores diferentes não podem ter o mesmo número de fornecedor (SNO), garantindo que cada fornecedor na tabela é **único**.

#### Resumo da Restrição de Chave:

Cada vez que se define um **KEY** num relvar, está-se a impor uma **restrição de chave**. Esta restrição diz que **não podem existir tuplas duplicadas** relativamente ao valor dos atributos que compõem a chave. No caso de **SNO**, significa que nenhum fornecedor pode ter o mesmo **SNO** que outro.

### 2. **Dependência Funcional (Functional Dependency - FD)**

Outro conceito importante introduzido no texto é o de **dependência funcional** (FD, *Functional Dependency*). O autor menciona que existe uma dependência funcional no relvar **S** que envolve os atributos **CITY** (cidade) e **STATUS** (estado do fornecedor).

#### Dependência Funcional: { CITY } → { STATUS }

A dependência funcional é expressa como **{CITY} → {STATUS}**, e pode ser lida de várias formas, como:

- O **STATUS** do fornecedor depende funcionalmente da **CITY**.
- A **CITY** determina o **STATUS**.
- Mais simplesmente, **CITY → STATUS** (Cidade determina Estado).

#### O que significa isto?

Esta dependência funcional diz que, **se dois fornecedores tiverem a mesma cidade (CITY), então eles também devem ter o mesmo estado (STATUS)**. 

Por exemplo, se dois fornecedores forem da cidade **Lisboa**, o valor do atributo **STATUS** tem de ser o mesmo para ambos. Não podem haver dois fornecedores de **Lisboa** com estados (STATUS) diferentes.

#### Exemplo com a tabela **S**:

Imaginemos a seguinte tabela de fornecedores (**S**):

| **SNO** | **SNAME** | **STATUS** | **CITY**  |
|---------|-----------|------------|-----------|
| S1      | João      | 20         | Lisboa    |
| S2      | Maria     | 20         | Lisboa    |
| S3      | Pedro     | 30         | Porto     |

Neste exemplo, a dependência funcional **{CITY} → {STATUS}** está a ser satisfeita, porque:
- Todos os fornecedores de **Lisboa** têm o **STATUS** igual a **20**.
- O fornecedor de **Porto** tem um **STATUS** diferente, mas isso é permitido porque a cidade é diferente.

Se, por outro lado, tivéssemos algo assim:

| **SNO** | **SNAME** | **STATUS** | **CITY**  |
|---------|-----------|------------|-----------|
| S1      | João      | 20         | Lisboa    |
| S2      | Maria     | 30         | Lisboa    |

Neste caso, a dependência funcional **não seria satisfeita**, porque há dois fornecedores de **Lisboa** com **STATUS** diferentes (**20** e **30**). Isto violaria a restrição imposta pela dependência funcional **{CITY} → {STATUS}**.

### 3. **Porquê Dependências Funcionais?**

As **dependências funcionais** são úteis para garantir **consistência** na base de dados. Elas impõem regras que os dados devem seguir. Neste exemplo, a dependência funcional **{CITY} → {STATUS}** garante que todos os fornecedores da mesma cidade têm o mesmo estado. Este tipo de restrição pode ser importante para manter a integridade dos dados e evitar informações conflitantes na base de dados.

### 4. **Resumo Final**:

- **Chaves (KEYs)**: Cada relvar (tabela) tem pelo menos uma chave, e esta chave impõe a restrição de que **não podem existir tuplas duplicadas** no que diz respeito aos atributos que compõem a chave. Por exemplo, no relvar **S**, a chave **SNO** garante que cada fornecedor tem um número único.
  
- **Dependências Funcionais (FDs)**: Uma **dependência funcional** é uma regra que especifica uma relação entre dois ou mais atributos. No caso de **{CITY} → {STATUS}**, a regra diz que se dois fornecedores tiverem a mesma cidade, eles também devem ter o mesmo estado (STATUS).

Estas restrições ajudam a **garantir a integridade dos dados** e a evitar inconsistências na base de dados. Elas impõem **regras** que as relações (tabelas) devem seguir, garantindo que os dados são coerentes e fiáveis.

---

# Página 91 e 92

O texto refere-se ao conceito de **Primeira Forma Normal** (**1NF**) no contexto de bases de dados relacionais e usa um exemplo com **relvars** (variáveis de relação) e **atributos** para explicar como funciona essa forma normal. Vou explicar isto em português de Portugal de forma clara, incluindo uma explicação da imagem que anexaste.

### 1. O que é a **Primeira Forma Normal (1NF)**?

A **Primeira Forma Normal** é uma propriedade de uma tabela (ou **relação**) que garante que **cada atributo em cada linha da tabela contém exatamente um valor** de um determinado tipo. Ou seja, **não há atributos que contenham múltiplos valores**, nem valores compostos.

### Definição Formal:
O texto dá a seguinte definição formal para a **1NF**:
- Uma tabela (ou **relação**) está em **1NF** se e só se, para todos os atributos da tabela, cada linha da tabela tem **um único valor**, do tipo correto, para cada atributo.

#### Exemplo com **Shipments** (Envios):
Imagina que tens a tabela **Shipments (SP)** que contém os seguintes atributos:
- **SNO** (número do fornecedor) do tipo **CHAR** (texto),
- **PNO** (número da parte) do tipo **CHAR** (texto),
- **QTY** (quantidade) do tipo **INTEGER** (número inteiro).

Cada linha da tabela deve conter **um único valor** para cada um destes atributos. Por exemplo:

| **SNO** | **PNO** | **QTY** |
|---------|---------|---------|
| S1      | P1      | 300     |
| S2      | P1      | 400     |

Cada célula da tabela tem exatamente um valor (por exemplo, "S1" no atributo **SNO**, "P1" no atributo **PNO**, e "300" no atributo **QTY**). Isto é o que significa estar em **1NF**: **não há valores múltiplos ou conjuntos de valores em nenhuma célula**.

### 2. Relational-Valued Attributes (RVAs):

A parte mais interessante deste conceito surge quando o texto menciona que, em teoria, os **atributos podem ter tipos de dados complexos, incluindo relações**. Ou seja, **atributos que contenham relações inteiras (outras tabelas)** são permitidos.

#### Exemplo com a Imagem (Figura 4-1):
Na imagem, podemos ver um exemplo que ilustra este conceito:

| **SNO** | **PQ**           |
|---------|------------------|
| S2      | (Tabela com PNO e QTY) |
| S3      | (Tabela com PNO e QTY) |

Aqui, no lugar de um valor simples, o atributo **PQ** contém **uma tabela inteira**. Essa tabela, para o fornecedor **S2**, por exemplo, contém:

| **PNO** | **QTY** |
|---------|---------|
| P1      | 300     |
| P2      | 400     |

Para o fornecedor **S3**, a tabela contida no atributo **PQ** contém:

| **PNO** | **QTY** |
|---------|---------|
| P2      | 200     |

Neste caso, o atributo **PQ** contém o que chamamos de **Relational-Valued Attribute (RVA)**, ou seja, um **atributo que contém uma relação (ou tabela) inteira como valor**. 

### 3. Porque é que isto não viola a **1NF**?

Pode parecer que a presença de uma tabela inteira dentro de uma célula viola a ideia da **Primeira Forma Normal**, já que estamos habituados a pensar que cada célula deve ter apenas um valor simples. No entanto, o autor explica que **isto não viola a 1NF**, porque:
- A 1NF **não coloca limitações no tipo de dados** que podem ser armazenados numa célula. Um **valor** pode ser um número, texto ou até uma relação (outra tabela).
- O requisito principal da 1NF é que **cada célula contenha exatamente um valor** — e neste caso, **o valor é a tabela inteira** (um tipo de dados complexo).

### 4. Vantagens e Limitações de RVAs:

A utilização de **RVAs** (atributos com relações como valores) pode ser útil em certos casos para representar dados mais complexos. No entanto, as bases de dados tradicionais e as práticas comuns de normalização tentam evitar este tipo de modelagem por várias razões:

- **Complexidade**: Consultar e manipular dados com RVAs pode ser mais complicado.
- **Desempenho**: Dependendo da implementação do sistema de base de dados, RVAs podem ser mais lentos de processar.

### 5. Resumo Final:

- A **Primeira Forma Normal (1NF)** exige que **cada célula** numa tabela contenha **exatamente um valor**, que pode ser de qualquer tipo (número, texto, ou até uma tabela inteira).
- Na imagem (Figura 4-1), vemos um exemplo onde o atributo **PQ** contém uma tabela inteira como valor, mostrando que atributos com relações como valores (**RVAs**) são permitidos e ainda satisfazem a 1NF.
- Embora **RVAs** possam ser válidos em termos de 1NF, o seu uso pode tornar-se complexo em bases de dados práticas.

---

# Página 95 e 96

Neste texto, o autor está a explicar como uma tabela pode **violar a Primeira Forma Normal (1NF)** e a diferença entre o que é considerado uma **relação** (relvar) e uma **tabela** nos sistemas de bases de dados comerciais. A explicação passa por cinco requisitos básicos para garantir que uma tabela está em conformidade com a 1NF e, portanto, é uma representação direta e fiel de um **relvar**.

### 1. Diferença entre Relvars e Tabelas

O autor começa por afirmar que **todos os relvars estão em 1NF por definição**. Em outras palavras, se algo for considerado uma **relação** (ou seja, um **relvar**), já está automaticamente em conformidade com a **1NF**, porque cada tupla (linha) contém exatamente um valor para cada atributo (coluna), conforme discutido anteriormente.

No entanto, ele faz a distinção de que **as tabelas em sistemas de bases de dados comerciais** (como o SQL) nem sempre seguem este princípio. **Tabelas comerciais podem violar a 1NF**, pois os sistemas de bases de dados modernos não suportam completamente o modelo relacional puro, mas sim uma implementação que pode conter certas "anomalias" ou "irregularidades".

### 2. Requisitos para uma Tabela estar em 1NF

O texto apresenta os cinco **requisitos** para que uma tabela seja uma **representação fiel e direta de um relvar** e, portanto, esteja em conformidade com a **1NF**. Estes requisitos são todos consequências diretas da definição de uma **relação**.

#### 1. **A tabela não pode conter linhas duplicadas**:

Este requisito é autoexplicativo. Numa relação (ou relvar), as linhas devem ser únicas. Não pode haver duas linhas na tabela com exatamente os mesmos valores para todos os atributos. Em bases de dados relacionais, isto é frequentemente garantido pela definição de uma **chave primária** (um ou mais atributos que identificam univocamente cada linha).

#### 2. **Não há ordem da esquerda para a direita nas colunas**:

Em bases de dados relacionais, a ordem das colunas numa tabela não deve ter significado. Se mudares a ordem das colunas, isso **não deve alterar a semântica** dos dados. Este é um requisito importante porque, na lógica relacional, os dados são representados como **conjuntos**, e a ordem dos elementos num conjunto não é relevante.

#### 3. **Não há ordem de cima para baixo nas linhas**:

Assim como no caso das colunas, a **ordem das linhas** numa tabela também **não deve importar**. As linhas podem ser apresentadas em qualquer ordem sem que isso altere o significado dos dados. Este é um conceito importante porque uma relação é um conjunto de tuplas, e conjuntos não têm ordem inerente.

#### 4. **Todas as colunas são colunas regulares**:

Este ponto merece uma explicação mais detalhada. Para uma tabela estar em conformidade com a **1NF**, todas as colunas devem ser **colunas regulares**, o que significa:

- **Cada coluna deve ter um nome próprio e único**: Isto significa que cada coluna pode ser referida diretamente pelo seu nome, e não deve haver duas colunas com o mesmo nome numa tabela. Num sistema SQL, por exemplo, isto seria garantido com a definição de nomes de colunas no comando `CREATE TABLE`.
  
- **Não podem existir colunas "escondidas"**: Não devem existir colunas que contenham valores "escondidos" ou especiais, que só podem ser acedidos através de operadores especiais e não de referências normais às colunas. No caso de sistemas de bases de dados SQL, o autor menciona colunas como **"IDs de linha"** ou **"IDs de objeto"**, que são usadas internamente por certos sistemas, mas não são visíveis diretamente ao utilizador.

#### 5. **Cada célula na tabela contém exatamente um valor do tipo aplicável**:

Este ponto é fundamental para a **Primeira Forma Normal (1NF)**. Cada interseção entre uma linha e uma coluna (ou seja, cada célula da tabela) deve conter **exatamente um valor** e **nada mais**. Este valor deve ser do tipo correto para a coluna em questão. Isto exclui valores múltiplos ou complexos dentro de uma célula (como listas, conjuntos ou sub-tabelas, exceto quando esses valores são representados de forma relacional, como discutido anteriormente).

### 3. Violar a 1NF nos Sistemas de Bases de Dados Comerciais

O autor menciona que, embora estas regras pareçam simples, **muitos sistemas de bases de dados comerciais** (como os que usam SQL) podem, de facto, violar a 1NF. Ele dá exemplos de "anomalias" que aparecem em alguns sistemas, como **colunas escondidas** (ex. `ROWID` no SQL) ou **identificadores de objetos** que não são acessíveis diretamente pelo utilizador mas que existem no sistema e podem interferir na operação regular da tabela.

### 4. Resumo Final:

Para que uma tabela esteja em conformidade com a **1NF** e seja uma **representação fiel de um relvar**, deve satisfazer os seguintes cinco requisitos:

1. **Sem duplicação de linhas**.
2. **Sem ordem específica das colunas**.
3. **Sem ordem específica das linhas**.
4. **Todas as colunas são "colunas regulares"**, ou seja, com nomes próprios e sem colunas escondidas.
5. **Cada célula contém exatamente um valor**, do tipo apropriado, e nada mais.

Estes requisitos asseguram que a tabela se comporta como uma **relação relacional** (ou **relvar**) e está em conformidade com a **Primeira Forma Normal (1NF)**. No entanto, como mencionado, muitos sistemas comerciais permitem estruturas que podem violar alguns destes princípios, o que pode causar inconsistências e anomalias.

---

# Página 96 e 97

Este texto discute o conceito de **atomicidade dos valores de dados** no contexto do **modelo relacional**, em especial no que diz respeito ao **Requisito 5**, que especifica que **cada interseção entre uma linha e uma coluna deve conter exatamente um valor do tipo aplicável**. Esta explicação detalha o que significa o termo **atómico** em bases de dados e como isso se aplica a diferentes tipos de dados, incluindo exemplos concretos.

### 1. **Proibição de Nulls (Nulos)**

O **Requisito 5** afirma que **nulls** (valores nulos) são proibidos. Um valor nulo não é um valor válido em termos relacionais, pois um **null** não representa nenhum dado — ele é essencialmente a ausência de um valor. Como tal, em conformidade com o modelo relacional, **não devem existir nulls numa tabela**.

### 2. **O que significa Atomicidade?**

O conceito de **atomicidade** (ou **valor atómico**) em bases de dados refere-se à ideia de que **os valores armazenados nas células de uma tabela devem ser indivisíveis** ou **não decomponíveis**. O termo **atómico** vem da palavra grega "átomo", que significa algo que não pode ser dividido.

Segundo **Codd**, o fundador do modelo relacional, um valor atómico significa que o valor não pode ser **decomposto pelo sistema de gestão de bases de dados (DBMS)**, nem de forma explícita (quando o utilizador pede) nem de forma implícita (internamente pelo sistema).

### 3. Exemplos de Atomicidade (ou a falta dela):

O texto apresenta vários exemplos de **valores de atributos** que podem ou não ser considerados atómicos, dependendo do ponto de vista. Estes exemplos ilustram que o conceito de **decomposição** pode ser interpretado de várias formas.

#### 3.1. **Strings de caracteres**:
- **Exemplo no contexto do Shipments**: Imagina que o nome do fornecedor (SNAME) no relvar **S** (Suppliers) é um string, como "João Silva".
  
  - Embora possas pensar que este string é atómico (pois é tratado como um único valor), **na realidade não é** completamente atómico, pois pode ser **decomposto** em partes menores. Por exemplo, em SQL, podes usar operadores como `SUBSTRING` ou `LIKE` para manipular e dividir strings. Portanto, strings não são completamente "indivisíveis".

#### 3.2. **Números de ponto fixo**:
- Um número de ponto fixo, como um preço ou peso (tal como o atributo **QTY** no relvar **SP** para a quantidade fornecida), pode ser decomposto em partes inteiras e partes fracionárias. Por exemplo, o valor **400.50** pode ser dividido em **400** (parte inteira) e **0.50** (parte fracionária). No entanto, na prática, o número de ponto fixo ainda é considerado atómico no modelo relacional.

#### 3.3. **Números inteiros**:
- Mesmo um número inteiro, como o **SNO** (número do fornecedor), pode ser matematicamente decomposto em **fatores primos** (por exemplo, o número **6** pode ser decomposto em **2 * 3**). No entanto, esta decomposição é geralmente irrelevante no contexto relacional, e os inteiros são normalmente considerados atómicos.

#### 3.4. **Datas e horas**:
- As datas e horas (por exemplo, uma data de envio, que poderia estar presente na tabela **Shipments**) podem ser decompostas nos seus componentes: **ano, mês, dia** ou **hora, minuto, segundo**. Embora internamente estas informações possam ser separadas, **num contexto relacional** tratamos a data ou a hora como um valor único, ou seja, atómico.

#### 3.5. **Expressões relacionais (views)**:
- O autor também menciona as **views** (vistas) definidas no catálogo da base de dados. Estas são expressões complexas que podem ser decompostas pelo DBMS, uma vez que o sistema deve ser capaz de "quebrar" a definição de uma **view** para aceder às tabelas subjacentes. Isso mostra como certos dados são **decompostos** pelo sistema de forma regular, o que pode parecer contraditório ao conceito de atomicidade.

### 4. **O Que Podemos Concluir?**

A mensagem principal do texto é que o conceito de **valor atómico** pode ser mais **complexo** e **sujeito a interpretação** do que pode parecer à primeira vista. Dependendo do tipo de dados, certos valores podem ser considerados atómicos ou não. O que importa realmente é que:

- **Do ponto de vista do utilizador** e **do DBMS**, o valor deve ser tratado como um valor único e indivisível no contexto do que ele representa.
- No modelo relacional, **não há restrição sobre o tipo de dados que pode ser usado como valor de atributo**. Pode ser um **inteiro**, um **string**, uma **data**, ou até mesmo uma **relação (tabela)**, como discutido anteriormente com as **tabelas aninhadas (nested tables)**.

Portanto, o valor atómico pode ser um valor complexo (como uma data ou uma tabela aninhada), desde que seja tratado pelo DBMS como um **único valor** que não pode ser decomposto **sem intervenção explícita do utilizador**.

### 5. Aplicação no Exemplo de **Shipments**:

Voltando ao exemplo de **Shipments**, consideremos o **atributo QTY** (quantidade). Um valor como **300** seria considerado atómico, pois, apesar de ser um número que pode ter várias interpretações matemáticas, **no contexto da base de dados** é tratado como um único valor numérico.

Da mesma forma, se um atributo como **CITY** armazenar "Lisboa", apesar de poderes dividir o string em letras ou palavras menores, **no contexto relacional** ele é tratado como um valor atómico.

### Resumo Final:

- **Atomicidade** refere-se ao fato de que os valores armazenados nas células de uma tabela devem ser indivisíveis do ponto de vista do **utilizador** e **do DBMS**.
- Certos tipos de dados (como strings, números e datas) podem ser decompostos em subcomponentes, mas ainda são considerados **atómicos** dentro do contexto relacional.
- O que importa é que o **DBMS trata o valor como um único elemento** que não pode ser dividido implicitamente pelo sistema.
- **Nulls** são proibidos no contexto relacional, pois não são considerados valores.

---

# Página 97 e 98


Este texto aborda o conceito de **dependências funcionais** (*functional dependencies, FDs*) e como elas são fundamentais para entender formas normais superiores, como a **Segunda Forma Normal (2NF)**, a **Terceira Forma Normal (3NF)** e a **Forma Normal de Boyce-Codd (BCNF)**. Vamos explorar este conceito em português de Portugal, utilizando o exemplo de **Shipments** (envios) para ilustrar.

### 1. **Definição de Dependência Funcional (Functional Dependency)**

O texto fornece a seguinte definição para **dependência funcional (FD)**:

- **X → Y** é uma dependência funcional em uma relação **R** se, e só se, **sempre que duas tuplas** (linhas) em **R** tiverem os mesmos valores em **X**, elas também têm os mesmos valores em **Y**.

Aqui, **X** é o **determinante** e **Y** é o **dependente**. Em outras palavras, **os valores de X determinam funcionalmente os valores de Y**.

#### Exemplo com Shipments:
Imaginemos a tabela **Shipments (SP)** com os seguintes atributos:
- **SNO**: Número do fornecedor.
- **PNO**: Número da parte.
- **QTY**: Quantidade.

Se tivermos uma dependência funcional como **{SNO, PNO} → {QTY}**, isto significa que para qualquer combinação de fornecedor e parte, a quantidade é sempre a mesma. Ou seja, **os valores de SNO e PNO determinam unicamente o valor de QTY**.

Vamos ilustrar isso com dados concretos:

| **SNO** | **PNO** | **QTY** |
|---------|---------|---------|
| S1      | P1      | 300     |
| S2      | P1      | 400     |
| S1      | P2      | 500     |

Neste exemplo, a dependência funcional **{SNO, PNO} → {QTY}** significa que para cada combinação de **SNO** e **PNO**, o valor de **QTY** é único. Se tivéssemos uma linha onde o mesmo fornecedor (**SNO**) fornece a mesma parte (**PNO**) com uma quantidade diferente, isso violaria a dependência funcional.

### 2. **Determinante e Dependente**

No contexto de **dependências funcionais**, temos dois componentes principais:

- **Determinante (X)**: O conjunto de atributos que determina os valores de outro conjunto de atributos.
- **Dependente (Y)**: O conjunto de atributos cujo valor é determinado pelo conjunto **X**.

No exemplo de **{SNO, PNO} → {QTY}**, o determinante **X** é o conjunto **{SNO, PNO}** (fornecedor e parte) e o dependente **Y** é o atributo **QTY** (quantidade).

### 3. **Exemplos de Dependências Funcionais (FDs)**

O texto oferece alguns exemplos de dependências funcionais, que também podemos aplicar ao nosso exemplo de **Shipments**.

#### 3.1. **{CITY} → {STATUS}** no relvar **S** (Fornecedores):
Este exemplo mostra que, na tabela de **Fornecedores (S)**, o valor de **CITY** determina funcionalmente o valor de **STATUS**. Ou seja, para cada cidade, o estado (status) dos fornecedores deve ser o mesmo. Se dois fornecedores estiverem na mesma cidade, eles devem ter o mesmo estado.

No nosso exemplo de **Shipments**, poderíamos imaginar uma dependência funcional parecida, como **{PNO} → {WEIGHT}** (se tivéssemos o atributo **WEIGHT** na tabela de partes). Isto significaria que cada parte tem um peso único associado a ela.

#### 3.2. **{SNO} → {SNAME, STATUS}** no relvar **S**:
Este exemplo mostra que o número do fornecedor (**SNO**) determina o nome do fornecedor (**SNAME**) e o seu estado (**STATUS**). Como o número do fornecedor é uma chave primária, ele determina unicamente os valores de outros atributos.

No caso de **Shipments**, se considerarmos que **SNO** é o número do fornecedor, poderíamos ter algo semelhante, como **{SNO} → {CITY}** (se tivermos o atributo **CITY**). Isto significaria que o número do fornecedor determina a cidade em que o fornecedor está localizado.

### 4. **"Arrows Out of Keys" (Dependências Funcionais a Partir de Chaves)**

O autor menciona que há sempre **"arrows out of keys"** (ou seja, dependências funcionais que partem de chaves). Isto significa que se um atributo ou um conjunto de atributos for uma **chave** (ou seja, um conjunto de atributos que identifica unicamente cada linha), então ele sempre determina todos os outros atributos na tabela.

#### Exemplo com Shipments:
Na tabela **Shipments**, a chave primária é o conjunto de atributos **{SNO, PNO}**. Isto significa que há uma dependência funcional **{SNO, PNO} → {QTY}**. Esta é a chamada "arrow out of keys", pois os valores de **SNO** e **PNO** (que formam a chave primária) determinam funcionalmente o valor de **QTY**.

### 5. Aplicações em Formas Normais Superiores

As **dependências funcionais** são essenciais para definir formas normais superiores, como a **Segunda Forma Normal (2NF)**, a **Terceira Forma Normal (3NF)** e a **Forma Normal de Boyce-Codd (BCNF)**. Estas formas normais são usadas para melhorar a organização de uma base de dados, minimizando a redundância de dados e evitando anomalias de atualização. Ao identificar dependências funcionais, podemos decidir como dividir as tabelas para garantir que as dependências sejam respeitadas e as formas normais sejam atingidas.

### Resumo Final:

- **Dependência Funcional (FD)**: Se houver uma dependência funcional **X → Y** numa tabela, isso significa que **os valores de X determinam os valores de Y**. Sempre que duas linhas tiverem os mesmos valores em **X**, elas também terão os mesmos valores em **Y**.
  
- **Exemplo com Shipments**: No caso da tabela **Shipments**, a dependência funcional **{SNO, PNO} → {QTY}** significa que os valores de **SNO** (número do fornecedor) e **PNO** (número da parte) determinam unicamente o valor de **QTY** (quantidade).

- **Chaves e Dependências Funcionais**: As chaves (conjuntos de atributos que identificam unicamente uma linha) sempre têm dependências funcionais que partem delas e determinam todos os outros atributos na tabela.

- **Aplicação**: As dependências funcionais são usadas para normalizar uma base de dados, removendo redundâncias e melhorando a integridade dos dados.

---

# Páginas 98 e 99

Este texto aborda dois conceitos importantes no contexto de **dependências funcionais (FDs)**: **superconjuntos e subconjuntos de FDs** e **dependências triviais**. Vamos explorar estes conceitos em português de Portugal, utilizando exemplos claros e o exemplo de **Shipments** para ilustrar.

### 1. Superconjuntos e Subconjuntos de Dependências Funcionais

O texto começa por introduzir um conceito útil: **se a dependência funcional (FD) X → Y se mantiver numa relação (relvar) R, então qualquer superconjunto de X e qualquer subconjunto de Y também formarão uma dependência funcional válida**. Isto significa que podemos **adicionar atributos ao determinante (X)** ou **remover atributos do dependente (Y)**, e a dependência funcional ainda será válida.

#### Exemplo com **Shipments**:
Imaginemos a seguinte dependência funcional no relvar **Shipments (SP)**:

- **{SNO, PNO} → {QTY}** — O número do fornecedor (**SNO**) e o número da parte (**PNO**) determinam a quantidade (**QTY**).

Agora, aplicando a regra de superconjuntos e subconjuntos, podemos modificar esta dependência funcional:

- Podemos **adicionar** mais atributos ao determinante, como, por exemplo, **CITY** (supondo que o atributo **CITY** existe na relação):
  - **{SNO, PNO, CITY} → {QTY}** — Adicionámos **CITY** ao lado esquerdo (determinante), e a dependência funcional ainda se mantém válida.

- Podemos também **remover** atributos do dependente. Se **QTY** fosse um conjunto de vários atributos (o que não é, neste caso), poderíamos remover um dos atributos. O exemplo dado no texto foi:
  - **{SNO, CITY} → {STATUS}** — Neste caso, **CITY** foi adicionado ao determinante e **SNAME** foi removido do dependente.

Em resumo, podemos **modificar** dependências funcionais ao **adicionar atributos ao determinante** e/ou **remover atributos do dependente**, e a FD ainda será válida, desde que os atributos modificados façam parte do esquema da relação.

### 2. Dependências Funcionais Triviais

O texto também introduz o conceito de **dependências triviais**. Uma dependência funcional é considerada **trivial** se **não houver nenhuma maneira de ela ser violada**. Isto acontece quando o conjunto de atributos no lado direito (**Y**) é um **subconjunto** ou igual ao conjunto no lado esquerdo (**X**).

#### Exemplo de Dependências Triviais:

O autor apresenta alguns exemplos de dependências triviais:

- **{CITY, STATUS} → {CITY}** — Isto é trivial porque, se duas tuplas têm o mesmo valor para **CITY** e **STATUS**, elas certamente têm o mesmo valor para **CITY**.
  
- **{CITY, STATUS} → {STATUS}** — Da mesma forma, se duas tuplas têm o mesmo valor para **CITY** e **STATUS**, elas também têm o mesmo valor para **STATUS**.

- **{CITY} → {CITY}** — Isto é a forma mais trivial de todas, pois se duas tuplas têm o mesmo valor para **CITY**, claro que elas terão o mesmo valor para **CITY**.

- **{CITY} → {}** — Este também é considerado trivial, pois não há nenhum atributo no lado direito para violar.

#### Definição Formal de Dependência Trivial:

Uma dependência funcional **X → Y** é considerada **trivial** se e só se **Y for um subconjunto de X**. Isto significa que todos os atributos no lado direito já estão incluídos no lado esquerdo. 

No caso de design de bases de dados, **dependências triviais** são frequentemente ignoradas porque são óbvias e não fornecem novas informações úteis. No entanto, quando estamos a desenvolver uma **teoria formal de design**, é importante levar em conta todas as dependências funcionais, triviais e não triviais.

### Exemplo com **Shipments** (Envios):

Imaginemos a seguinte tabela **Shipments (SP)** com os atributos **SNO**, **PNO** e **QTY**:

| **SNO** | **PNO** | **QTY** |
|---------|---------|---------|
| S1      | P1      | 300     |
| S2      | P1      | 400     |
| S1      | P2      | 500     |

Agora, podemos considerar algumas dependências triviais baseadas nestes atributos:

- **{SNO, PNO} → {SNO}** — Isto é trivial porque se duas linhas têm o mesmo **SNO** e **PNO**, elas certamente terão o mesmo valor de **SNO**.
  
- **{SNO} → {SNO}** — Isto também é trivial, pois se duas linhas têm o mesmo valor de **SNO**, elas, obviamente, terão o mesmo **SNO**.

Estas dependências funcionais triviais não são úteis em termos de design de bases de dados, mas elas são formalmente verdadeiras e não podem ser violadas.

### 3. Resumo Final:

#### Superconjuntos e Subconjuntos de FDs:
- Se uma dependência funcional **X → Y** se mantém, então qualquer **superconjunto de X** e **subconjunto de Y** também formará uma FD válida.
- No exemplo de **Shipments**, se **{SNO, PNO} → {QTY}**, então **{SNO, PNO, CITY} → {QTY}** também será uma FD válida, assumindo que **CITY** faz parte da relação.

#### Dependências Funcionais Triviais:
- Uma dependência funcional **X → Y** é **trivial** se **Y for um subconjunto de X**. Estas dependências são sempre verdadeiras e não podem ser violadas.
- Exemplos de FDs triviais em **Shipments** seriam **{SNO, PNO} → {SNO}** ou **{SNO} → {SNO}**.

Dependências triviais não são úteis para o design prático de bases de dados, mas são levadas em consideração em abordagens formais e teóricas do design relacional.

---

# Páginas 99 e 100

Este texto aprofunda o conceito de **chave (key)** no modelo relacional, introduzindo várias definições e terminologias importantes para o design de bases de dados. Vamos explicar em português de Portugal, utilizando o exemplo de **Shipments (SP)** para ilustrar.

### 1. Definição de **Chave Candidata** (*Candidate Key*)

Uma **chave candidata** (ou simplesmente **chave**) é um **conjunto de atributos** numa tabela (ou **relvar**) que satisfaz duas propriedades essenciais:

1. **Unicidade**: Nenhum valor legítimo da relação pode conter duas tuplas (linhas) distintas com o mesmo valor para o conjunto de atributos que constitui a chave. Isto significa que a **chave** garante que cada linha na tabela é **única**.

2. **Irredutibilidade**: Nenhum subconjunto da chave pode possuir a propriedade de unicidade. Ou seja, a chave é o **mínimo conjunto** de atributos que garante a unicidade — se retirarmos qualquer atributo, essa propriedade deixa de se verificar.

#### Exemplo com **Shipments (SP)**:
Na tabela **Shipments**, temos os atributos **SNO** (número do fornecedor), **PNO** (número da parte), e **QTY** (quantidade). A **chave candidata** para esta tabela é **{SNO, PNO}**, porque:
- **Unicidade**: Cada combinação de **SNO** e **PNO** identifica de forma única cada linha na tabela. Não há dois registos com o mesmo **SNO** e **PNO**.
- **Irredutibilidade**: Se removêssemos **SNO** ou **PNO** da chave, a unicidade deixaria de ser garantida, já que o mesmo fornecedor (**SNO**) pode fornecer várias partes (**PNO**), e a mesma parte (**PNO**) pode ser fornecida por vários fornecedores (**SNO**).

Portanto, **{SNO, PNO}** é uma chave candidata em **Shipments**.

### 2. **Irredutibilidade das Chaves**

A **irredutibilidade** é uma propriedade fundamental, pois garante que a chave é o **mínimo conjunto possível de atributos** que ainda mantém a unicidade. Se especificássemos uma chave que **não** fosse irredutível, o sistema de gestão de bases de dados (DBMS) não conseguiria impor corretamente a restrição de unicidade.

#### Exemplo:
Se mentíssemos ao DBMS e disséssemos que a chave da tabela **S** (Fornecedores) fosse **{SNO, CITY}** (número do fornecedor e cidade), o DBMS apenas garantiria que os números de fornecedores são **únicos dentro de cada cidade**. No entanto, o número do fornecedor (**SNO**) deve ser **globalmente único** na tabela, independentemente da cidade.

### 3. **Atributos Chave e Atributos Não Chave**

Com base na definição de chave, podemos agora distinguir entre dois tipos de atributos:

- **Atributo chave** (*key attribute*): Um atributo é considerado um **atributo chave** se fizer parte de pelo menos uma chave da relação.

- **Atributo não chave** (*nonkey attribute*): Um atributo é **não chave** se **não fizer parte de nenhuma chave**.

#### Exemplo com **Shipments**:
Na tabela **Shipments**:
- **SNO** e **PNO** são **atributos chave** porque fazem parte da chave candidata **{SNO, PNO}**.
- **QTY** é um **atributo não chave** porque **não faz parte de nenhuma chave**.

### 4. **Relvar "All Key" (Todos os Atributos São Chave)**

Um **relvar "all key"** é uma tabela onde **todos os atributos constituem a chave**. Ou seja, o cabeçalho completo da tabela (todos os seus atributos) é a chave, e não há subconjuntos de atributos que possam ser usados como chave.

Se uma tabela for "all key", então:
- Todos os seus atributos são **chaves**, e
- **Não tem atributos não chave**, porque todos os atributos fazem parte da chave.

No entanto, o inverso não é necessariamente verdade: uma tabela pode ter **todos os atributos como chaves**, mas isso **não significa** que seja "all key". Isso acontece se existir mais do que uma chave candidata.

### 5. **Superchave (Superkey)**

Por fim, uma **superchave** é um conjunto de atributos que também garante a **unicidade** das linhas numa tabela, mas pode não ser irredutível. Em outras palavras, uma **superchave** é um **conjunto de atributos que garante a unicidade**, mas pode conter mais atributos do que o necessário.

#### Exemplo com **Shipments**:
Se **{SNO, PNO}** for a chave candidata de **Shipments**, então qualquer conjunto que inclua **{SNO, PNO}** é uma **superchave**. Por exemplo:
- **{SNO, PNO, QTY}** é uma **superchave**, porque também garante a unicidade das linhas, mas não é irredutível (já que **QTY** não é necessário para garantir a unicidade).

### 6. Resumo Final:

- **Chave candidata (candidate key)**: Um conjunto de atributos que garante a unicidade das linhas e é irredutível.
  - Exemplo: **{SNO, PNO}** em **Shipments**.
  
- **Unicidade (uniqueness)**: A chave garante que não há duas tuplas com os mesmos valores.
  
- **Irredutibilidade (irreducibility)**: Não se pode remover nenhum atributo da chave sem perder a propriedade de unicidade.

- **Atributo chave (key attribute)**: Um atributo que faz parte de pelo menos uma chave.
  - Exemplo: **SNO** e **PNO**.

- **Atributo não chave (nonkey attribute)**: Um atributo que não faz parte de nenhuma chave.
  - Exemplo: **QTY**.

- **Relvar "all key"**: Um relvar em que todos os atributos constituem a chave.

- **Superchave (superkey)**: Um conjunto de atributos que garante a unicidade, mas pode conter atributos desnecessários.

---

# Páginas 101 e 102

Este texto explora os conceitos de **superchaves (superkeys)** e **subchaves (subkeys)**, além de como elas se relacionam com as **chaves** em bases de dados relacionais. Vamos explicar esses conceitos em português de Portugal, usando exemplos práticos, incluindo o relvar **Shipments (SP)**, para melhor ilustrar.

### 1. **Superchave (Superkey)**

Uma **superchave** para uma relação **R** é um **subconjunto do cabeçalho (heading) de R** que garante que todas as tuplas (linhas) da tabela são únicas, mas **não necessariamente irredutível**. Isso significa que uma **superchave** pode conter mais atributos do que o necessário para garantir a unicidade das linhas.

#### Relação com Chaves:

- **Todas as chaves são superchaves**, porque garantem a unicidade, mas nem todas as superchaves são chaves.
- Uma **superchave** que **não é irredutível** (ou seja, que contém mais atributos do que o necessário) é chamada de **superchave própria** (*proper superkey*).

#### Exemplo com **Shipments (SP)**:
Consideremos a tabela **Shipments (SP)**, que tem os atributos:
- **SNO**: Número do fornecedor.
- **PNO**: Número da parte.
- **QTY**: Quantidade.

A chave candidata (chave primária) para **SP** é **{SNO, PNO}**, porque identifica unicamente cada envio.

Agora, exemplos de **superchaves**:

a. **{SNO, PNO}** — Esta é uma superchave, porque identifica unicamente cada linha.

b. **{SNO, PNO, QTY}** — Esta também é uma superchave, mas é uma **superchave própria**, porque o atributo **QTY** não é necessário para garantir a unicidade. A presença de **SNO** e **PNO** já assegura que a linha é única.

#### Observação:
- O **cabeçalho completo** (todos os atributos da tabela) é sempre uma **superchave**, já que contém todos os atributos que garantem a unicidade.

### 2. **Subchave (Subkey)**

Uma **subchave** é um **subconjunto de pelo menos uma chave** da relação. Em outras palavras, uma **subchave** é formada por parte de uma chave candidata.

- Uma **subchave** que **não é a chave completa** é chamada de **subchave própria** (*proper subkey*).

#### Exemplo com **Shipments (SP)**:
A chave candidata de **SP** é **{SNO, PNO}**. Agora, podemos identificar várias **subchaves**:

a. **{SNO, PNO}** — Esta é a própria chave candidata.

b. **{SNO}** — Isto é uma **subchave própria**, porque é parte da chave completa **{SNO, PNO}**.

c. **{PNO}** — Isto também é uma **subchave própria**, porque é parte da chave completa.

d. **{ }** (conjunto vazio) — O **conjunto vazio** é sempre uma subchave de qualquer relação, porque é considerado parte de todas as chaves.

### 3. **Relação entre Superchaves e Dependências Funcionais (FDs)**

Sempre que uma **superchave** é identificada, podemos afirmar que existe uma **dependência funcional (FD)** associada a ela. Isto é, **se SK for uma superchave, então SK → H**, onde **H** é o cabeçalho completo da relação.

Isto significa que, se duas tuplas da relação tiverem o mesmo valor para os atributos da superchave, elas devem ser a **mesma tupla**, garantindo que todos os outros atributos (no cabeçalho) também terão os mesmos valores.

#### Exemplo:
Se **{SNO, PNO}** for uma **superchave** em **Shipments**, então a FD **{SNO, PNO} → {SNO, PNO, QTY}** deve ser verdadeira. Isto significa que se duas linhas têm o mesmo valor para **SNO** e **PNO**, então todas as outras colunas, incluindo **QTY**, também devem ter os mesmos valores, garantindo que são a mesma linha.

### 4. Resumo Final:

- **Superchave (Superkey)**: Um conjunto de atributos que garante a unicidade das linhas numa tabela, mas que pode conter mais atributos do que o necessário.
  - Exemplo: **{SNO, PNO}** é uma superchave em **Shipments**, e **{SNO, PNO, QTY}** é uma superchave própria.

- **Chave (Key)**: Uma superchave que é **irredutível**, ou seja, não pode ter nenhum atributo removido sem perder a unicidade.
  - Exemplo: **{SNO, PNO}** é uma chave em **Shipments**.

- **Subchave (Subkey)**: Um subconjunto de pelo menos uma chave. A subchave pode ser a própria chave ou parte dela.
  - Exemplo: **{SNO}** e **{PNO}** são subchaves próprias de **{SNO, PNO}**.

- **Dependências Funcionais e Superchaves**: Sempre que existe uma superchave, podemos afirmar que existe uma **dependência funcional** que determina todos os outros atributos da relação. Exemplo: **{SNO, PNO} → {SNO, PNO, QTY}**.

Estes conceitos são importantes para garantir o design correto e a integridade dos dados em bases de dados relacionais, assegurando que os atributos são organizados de forma eficiente e consistente.


---

# Páginas 102 a 104

Este texto discute o conceito de **Segunda Forma Normal (2NF)** em bases de dados relacionais, destacando a importância da **irreducibilidade das dependências funcionais** e como a presença de redundâncias pode significar que uma tabela não está em 2NF. Vamos explicar este conceito de forma clara, usando o exemplo e a tabela apresentada (**SCP**) para ilustrar a aplicação prática.

### 1. Definição de **Dependência Funcional Irredutível (Irreducible FD)**

Uma **dependência funcional (FD)** é considerada **irredutível** com respeito a uma relação **R** se:
- **X → Y** é uma FD que se mantém em **R**, mas **não é possível remover atributos de X** e ainda manter a dependência funcional.

Ou seja, se tentarmos retirar qualquer atributo de **X** (determinante) e a dependência funcional continuar válida, então essa FD **não é irredutível**.

#### Exemplo com **Shipments (SP)**:
A FD **{SNO, PNO} → {QTY}** é **irredutível** para a tabela **Shipments** porque:
- **SNO** (número do fornecedor) e **PNO** (número da parte) juntos determinam unicamente **QTY** (quantidade).
- Se retirássemos **PNO**, **{SNO} → {QTY}** não seria mais uma FD válida, pois um fornecedor pode fornecer várias partes, cada uma com diferentes quantidades.

Portanto, **{SNO, PNO} → {QTY}** é irredutível porque não podemos remover nenhum atributo do lado esquerdo sem perder a unicidade.

### 2. Definição de **Segunda Forma Normal (2NF)**

Uma tabela está em **Segunda Forma Normal (2NF)** se:

1. Para todas as chaves de **R** e todos os **atributos não chave** de **R**, a dependência funcional **K → {A}** é **irredutível**. Isso significa que a chave **K** deve determinar cada atributo não chave, sem que seja possível remover qualquer atributo de **K**.

2. (Definição preferida) Para qualquer **FD não trivial X → Y** que se mantenha em **R**, pelo menos uma das seguintes condições deve ser verdadeira:
   - **X** é uma **superchave**.
   - **Y** é uma **subchave**.
   - **X** **não** é uma **subchave**.

Em termos simples, uma tabela **não está em 2NF** se houver dependências parciais — ou seja, se houver atributos que dependem apenas de parte de uma chave composta.

### 3. Exemplo de **Segunda Forma Normal (2NF)**: Tabela **SCP**

A tabela **SCP** apresentada tem os seguintes atributos:
- **SNO**: Número do fornecedor.
- **CITY**: Cidade do fornecedor.
- **PNO**: Número da parte.
- **QTY**: Quantidade fornecida.

A chave candidata da tabela **SCP** é **{SNO, PNO}**, o que significa que a combinação de **SNO** e **PNO** identifica unicamente cada linha.

#### Análise da Dependência Funcional:

Na tabela **SCP**, observamos que o atributo **CITY** (cidade do fornecedor) depende apenas de **SNO** (número do fornecedor). Isto pode ser visto da seguinte forma:

- Existe uma dependência funcional **{SNO, PNO} → {CITY}**, mas esta **não é irredutível**. Podemos remover **PNO** do lado esquerdo e a dependência **{SNO} → {CITY}** ainda será válida, porque a cidade de um fornecedor não depende da parte que ele fornece — apenas do próprio fornecedor (**SNO**).

#### Conclusão:
A dependência funcional **{SNO} → {CITY}** indica que **CITY** depende apenas de uma parte da chave composta **{SNO, PNO}**. Isto significa que a tabela **SCP** **não está em Segunda Forma Normal (2NF)**, porque há uma dependência parcial — **CITY** depende de apenas uma parte da chave composta, **SNO**.

### 4. Aplicação das Definições de 2NF

De acordo com a definição de **2NF**, a tabela **SCP** não está em conformidade com a Segunda Forma Normal porque:

- **{SNO, PNO} → {CITY}** não é uma dependência funcional irredutível. A FD **{SNO} → {CITY}** mantém-se mesmo quando removemos **PNO** do lado esquerdo.
- Aplicando a definição preferida de 2NF:
  - **SNO** não é uma **superchave**.
  - **CITY** não é uma **subchave**.
  - **SNO** é uma **subchave**.

Portanto, a tabela **SCP** não está em 2NF porque violamos as regras da dependência funcional e temos redundância — cada vez que **S1** aparece, sabemos que ele está em **London**, o que resulta em **redundância de dados**.

### 5. Redundância na Tabela **SCP**

A tabela **SCP** sofre de **redundância**, pois a cidade do fornecedor (**CITY**) é repetida em cada linha onde o fornecedor aparece, independentemente da parte fornecida. No caso de **S1**, a cidade **London** é repetida em cada tupla para **S1**.

Isto pode ser resolvido ao separar **CITY** para uma tabela separada de fornecedores, onde a cidade do fornecedor depende exclusivamente de **SNO**.

### 6. Resumo Final:

- **Dependência Funcional Irredutível**: Uma dependência funcional é irredutível se não pudermos remover atributos do determinante sem perder a dependência funcional.
  - Exemplo: **{SNO, PNO} → {QTY}** é irredutível em **Shipments**.
  
- **Segunda Forma Normal (2NF)**: Uma tabela está em 2NF se não houver dependências parciais — ou seja, se nenhum atributo não chave depender apenas de parte de uma chave composta.
  - A tabela **SCP** não está em 2NF, pois **CITY** depende apenas de **SNO**, que é parte da chave composta **{SNO, PNO}**.

- **Redundância**: A presença de dependências parciais causa redundância de dados, como visto no exemplo de **SCP**, onde a cidade do fornecedor é repetida em cada linha.

---

# Páginas 104 e 105

Este texto discute o conceito de **Terceira Forma Normal (3NF)** em bases de dados relacionais, destacando a sua relação com a **Segunda Forma Normal (2NF)** e como a 3NF é frequentemente usada como um passo para alcançar a **Forma Normal de Boyce-Codd (BCNF)**. Vamos explicar em português de Portugal, utilizando exemplos e aplicando o conceito à tabela **SCP** (ou **Shipments**).

### 1. Definição de **Terceira Forma Normal (3NF)**

A **Terceira Forma Normal (3NF)** é definida da seguinte maneira:

- Uma tabela (**relvar R**) está em **3NF** se, para cada **dependência funcional (FD) não trivial** do tipo **X → Y** que se mantém em **R**, pelo menos uma das seguintes condições é verdadeira:
  1. **X é uma superchave** (ou seja, **X** garante a unicidade de todas as tuplas da tabela).
  2. **Y é uma subchave** (ou seja, **Y** faz parte de uma chave).

De forma simples, a **3NF** evita **dependências transitivas**, que ocorrem quando um **atributo não chave** depende de outro **atributo não chave** através de uma chave parcial.

#### Relação com 2NF:
- A **3NF** implica que a tabela já está em **2NF** (uma tabela em **3NF** está, portanto, automaticamente em **2NF**). A diferença é que a **3NF** vai um passo além ao eliminar **dependências transitivas**.

### 2. Diferença entre 3NF e BCNF

O texto menciona que a **3NF** é considerada, na maioria dos casos, um **passo intermédio** para alcançar a **BCNF** (Forma Normal de Boyce-Codd). A **BCNF** é mais rigorosa e importante para evitar redundâncias e anomalias. Muitas vezes, as definições populares de 3NF que encontramos na literatura são, na verdade, definições de **BCNF**, o que pode gerar confusão.

Portanto, o objetivo final de normalização seria alcançar a **BCNF**, mas a **3NF** já ajuda a melhorar significativamente a integridade e a organização dos dados.

### 3. Exemplo de uma Tabela que Não Está em 3NF: **Suppliers (S)**

O autor faz referência a um exemplo de uma tabela de fornecedores (**Suppliers**), onde a **dependência funcional** **{CITY} → {STATUS}** existe. Vamos analisar este caso para compreender melhor o que significa uma tabela **não estar em 3NF**.

#### Análise da FD **{CITY} → {STATUS}**:
- A dependência **{CITY} → {STATUS}** significa que, para cada cidade, o estado do fornecedor (**STATUS**) depende unicamente da cidade (**CITY**).
- No entanto, **CITY** **não é uma superchave** — a cidade não identifica unicamente as linhas da tabela.
- **STATUS** **não é uma subchave**, ou seja, **STATUS** não faz parte de nenhuma chave primária.

Portanto, a tabela **Suppliers (S)** **não está em 3NF** porque há uma dependência funcional que não satisfaz as condições necessárias (nem **CITY** é uma superchave, nem **STATUS** é uma subchave).

### 4. Aplicação à Tabela **SCP**

Vamos aplicar este conceito à tabela **SCP** que contém os atributos **SNO** (número do fornecedor), **CITY** (cidade), **PNO** (número da parte), e **QTY** (quantidade fornecida). A chave candidata desta tabela é **{SNO, PNO}**, o que significa que a combinação de **SNO** e **PNO** identifica unicamente cada linha na tabela.

#### Dependências Funcionais:
Na tabela **SCP**, há uma **dependência funcional** que causa problemas de normalização:
- **{SNO} → {CITY}**: Esta dependência significa que a cidade do fornecedor (**CITY**) depende apenas do número do fornecedor (**SNO**).

Agora, aplicando as condições da **3NF**:
- **SNO** **não é uma superchave**, porque, por si só, não identifica unicamente cada linha da tabela — precisamos de **SNO** e **PNO** juntos para garantir a unicidade.
- **CITY** **não é uma subchave**, porque **CITY** não faz parte de nenhuma chave primária.

Portanto, a tabela **SCP** **não está em 3NF**, porque há uma dependência funcional transitiva — a cidade (**CITY**) depende apenas de **SNO**, e não diretamente da chave completa **{SNO, PNO}**.

### 5. Como Resolver?

Para corrigir esta violação da **3NF**, podemos **desnormalizar** a tabela, separando as dependências transitivas. Poderíamos criar uma nova tabela apenas para as informações de fornecedores e cidades:

- **Tabela Fornecedores (Fornecedores)**: Contém os atributos **SNO** e **CITY** (um fornecedor tem uma cidade associada).
  
- **Tabela Shipments (Envios)**: Contém os atributos **SNO**, **PNO**, e **QTY**, sem a redundância de **CITY**.

Desta forma, eliminamos a dependência funcional transitiva e a redundância de dados.

### 6. Resumo Final:

- **Terceira Forma Normal (3NF)**: Uma tabela está em 3NF se, para todas as dependências funcionais **X → Y**, pelo menos uma das seguintes condições for verdadeira: **X** é uma superchave, ou **Y** é uma subchave.
  - A **3NF** evita dependências transitivas.

- **Exemplo**: A tabela **Suppliers (S)** não está em 3NF devido à dependência funcional **{CITY} → {STATUS}**, onde **CITY** não é uma superchave e **STATUS** não é uma subchave.

- **SCP**: A tabela **SCP** também não está em 3NF devido à dependência funcional **{SNO} → {CITY}**, que não satisfaz as condições de 3NF. Para corrigir isso, a tabela precisaria ser dividida para eliminar a redundância.

---

# Páginas 105 a 107

Este texto apresenta e explica a **Boyce-Codd Normal Form (BCNF)**, uma forma normal avançada em bases de dados relacionais que elimina dependências funcionais problemáticas, garantindo que todas as dependências funcionais são em relação a superchaves. Vamos analisar este conceito em detalhe, com base no exemplo da tabela **SNP** que é apresentada na imagem.

### 1. Definição de **BCNF (Boyce-Codd Normal Form)**

Uma tabela (**relvar R**) está em **BCNF** se, para cada **dependência funcional (FD) não trivial** **X → Y**, a seguinte condição for verdadeira:
- **X é uma superchave**.

Em outras palavras, qualquer dependência funcional que se mantenha na tabela deve envolver uma **superchave** no lado esquerdo (**X**). Ou seja, todas as dependências devem partir de uma superchave, que garante a unicidade das linhas.

#### Diferença entre BCNF e 3NF:
- A **3NF** permite que uma dependência **X → Y** exista mesmo que **X** não seja uma superchave, desde que **Y** seja uma subchave.
- A **BCNF** é mais restrita: **X** deve sempre ser uma **superchave**, o que elimina completamente dependências problemáticas.

Portanto, a **BCNF** é uma forma normal mais forte que a **3NF**.

### 2. Exemplo de uma Tabela que Não Está em BCNF: **SNP**

O texto utiliza a tabela **SNP** (mostrada na imagem), que contém os seguintes atributos:
- **SNO**: Número do fornecedor.
- **SNAME**: Nome do fornecedor.
- **PNO**: Número da parte.
- **QTY**: Quantidade fornecida.

#### Análise de Dependências Funcionais:

Na tabela **SNP**, existem duas chaves candidatas:
- **{SNO, PNO}**: A combinação de número do fornecedor e número da parte identifica unicamente cada linha.
- **{SNAME, PNO}**: A combinação de nome do fornecedor e número da parte também identifica unicamente cada linha, já que o nome do fornecedor é único.

No entanto, há duas **dependências funcionais problemáticas**:
1. **{SNO} → {SNAME}**: O número do fornecedor (**SNO**) determina o nome do fornecedor (**SNAME**).
2. **{SNAME} → {SNO}**: O nome do fornecedor (**SNAME**) determina o número do fornecedor (**SNO**).

Ambas as dependências são **não triviais**, mas não satisfazem a condição de BCNF porque:
- **SNO** e **SNAME** **não são superchaves** — por si só, não garantem a unicidade de todas as colunas na tabela.
- Estas dependências causam **redundância**, uma vez que, cada vez que **S1** aparece, sabemos que o nome é **Smith**, o que resulta na repetição dessa informação.

Portanto, a tabela **SNP** **não está em BCNF**, apesar de estar em **3NF**. A BCNF não permite que existam dependências funcionais entre atributos não chave, como **{SNO} → {SNAME}** ou **{SNAME} → {SNO}**.

### 3. Solução: Decomposição para Atingir BCNF

Quando uma tabela **não está em BCNF**, a solução proposta pela disciplina de **normalização** é **decompor a tabela** em projeções menores que estejam em conformidade com a **BCNF**.

#### Decomposição de **SNP**:
Podemos decompor a tabela **SNP** de duas maneiras:

1. Projetando em **{SNO, SNAME}** e **{SNO, PNO, QTY}**.
   - A tabela **{SNO, SNAME}** armazena a relação entre o número do fornecedor e o nome do fornecedor, eliminando a redundância de nomes repetidos.
   - A tabela **{SNO, PNO, QTY}** armazena os envios, eliminando a dependência transitiva.

2. Projetando em **{SNO, SNAME}** e **{SNAME, PNO, QTY}**.
   - A tabela **{SNO, SNAME}** armazena o número do fornecedor e o nome.
   - A tabela **{SNAME, PNO, QTY}** armazena as partes fornecidas, usando o nome do fornecedor como chave.

Estas decomposições eliminam as dependências problemáticas e garantem que ambas as tabelas resultantes estão em **BCNF**, sem redundância de dados.

### 4. Diferença entre BCNF e Outras Formas Normais

A **BCNF** é mais rigorosa do que a **3NF**, e é considerada mais importante em termos práticos porque elimina todas as dependências problemáticas. No entanto, o autor menciona que a **BCNF** não recebeu o nome de "4ª forma normal" porque **Fagin** já tinha introduzido a **Quarta Forma Normal (4NF)**, que lida com multivalores.

### 5. Resumo Final:

- **BCNF (Boyce-Codd Normal Form)**: Uma tabela está em **BCNF** se, para cada **dependência funcional não trivial X → Y**, **X** for uma **superchave**.
  - A **BCNF** é mais forte que a **3NF** porque elimina todas as dependências problemáticas, incluindo aquelas entre atributos não chave.
  
- **Exemplo com SNP**: A tabela **SNP** não está em BCNF devido às dependências **{SNO} → {SNAME}** e **{SNAME} → {SNO}**, que não envolvem superchaves. Apesar de estar em **3NF**, a tabela ainda apresenta redundância e deve ser **decomposta** para alcançar a **BCNF**.

- **Solução**: A decomposição da tabela **SNP** em projeções menores (por exemplo, **{SNO, SNAME}** e **{SNO, PNO, QTY}**) elimina a redundância e garante que as novas tabelas resultantes estejam em **BCNF**.
