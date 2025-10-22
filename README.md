Projeto de Laboratório: Cadastro de Alunos em TypeScript

Este é um projeto simples de console (CLI) desenvolvido como um exercício de laboratório. O objetivo é capturar dados de alunos e suas notas, calcular as médias e persistir essas informações em um banco de dados PostgreSQL que roda em um container Docker.

Funcionalidades Principais

    Coleta de Dados: Solicita interativamente o nome, idade e série do aluno.

    Cálculo de Média: Pede 8 notas para três matérias (Geografia, Matemática e História) e calcula a média de cada uma.

    Persistência de Dados: Salva os dados do aluno e suas médias em um banco de dados PostgreSQL.

    Criação Automática de Tabelas: O script verifica e cria as tabelas alunos e medias automaticamente na primeira execução, se elas não existirem.

    Transações Seguras: Utiliza transações SQL (BEGIN, COMMIT, ROLLBACK) para garantir que os dados do aluno e suas médias sejam salvos juntos, ou que nada seja salvo em caso de erro.

Tecnologias Utilizadas

    Linguagem: TypeScript

    Ambiente de Execução: Node.js

    Executor TypeScript: ts-node

    Banco de Dados: PostgreSQL (versão 16)

    Containerização: Docker e Docker Compose

    Driver do Banco: node-postgres (pg)

    Input de Terminal: prompt-sync

Pré-requisitos

Antes de começar, você precisa ter as seguintes ferramentas instaladas em sua máquina:

    Node.js: (Recomendado v18 ou superior). Isso também instalará o npm.

    Docker Desktop: (Para Windows/Mac) ou Docker Engine (Para Linux).

Como Instalar e Executar o Projeto

Siga estes passos na ordem correta para configurar e rodar a aplicação.

1. Obter os Arquivos

Clone este repositório ou baixe os arquivos para uma pasta em seu computador.

2. Instalar as Dependências do Node.js

Abra seu terminal na pasta raiz do projeto (onde está o package.json) e execute o comando abaixo. Isso instalará todas as bibliotecas necessárias.
Bash

npm install

Este comando instalará:

    typescript: A própria linguagem.

    ts-node: Para executar o código TypeScript diretamente.

    pg: O driver para conectar o Node.js ao PostgreSQL.

    prompt-sync: Para capturar os inputs do usuário no terminal.

    @types/*: Os arquivos de definição de tipo para o TypeScript entender essas bibliotecas.

3. Iniciar o Banco de Dados com Docker

Com o Docker Desktop rodando, execute o seguinte comando no terminal. Este comando lerá o arquivo docker-compose.yml e criará/iniciará o container do PostgreSQL em segundo plano (-d).
Bash

docker-compose up -d

O container escola-db estará rodando e acessível na porta 5432 da sua máquina (localhost).

Para parar o container (quando não for mais usar):
Bash

docker-compose down

4. Executar o Script

Finalmente, para rodar a aplicação, execute:
Bash

ts-node src/index.ts

O script começará, fará a verificação das tabelas no banco de dados e, em seguida, solicitará os dados do aluno e as notas. Ao final, ele exibirá um resumo e salvará tudo no banco.

Verificando os Dados no Banco

Após executar o script pelo menos uma vez, os dados estarão salvos. Você pode verificá-los usando uma ferramenta visual como o pgAdmin.

Configuração do pgAdmin

    Abra o pgAdmin e crie uma nova conexão de servidor.

    Use as seguintes credenciais (definidas no docker-compose.yml):

        Host: localhost

        Port: 5432

        Database: escola

        Username: admin

        Password: 123456

Consultando os Dados

Após conectar, abra a "Query Tool" (Ferramenta de Consulta) para o banco escola e execute os seguintes comandos SQL:

Para ver os alunos cadastrados:
SQL

SELECT * FROM alunos;

Para ver as médias cadastradas:
SQL

SELECT * FROM medias;

Para ver um relatório completo (Aluno + Matéria + Média):
SQL

SELECT
    a.nome,
    a.serie,
    m.materia,
    m.media
FROM 
    alunos a
JOIN 
    medias m ON a.id = m.aluno_id;
