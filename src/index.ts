// CORREÇÃO: Trocamos o 'import' pelo 'require' para ser compatível com CommonJS
const { Pool } = require('pg');

// Mantemos o prompt-sync para pegar os dados do usuário
const promptSync = require('prompt-sync');
const input = promptSync({ sigint: true });

// --- 1. Configuração do Banco de Dados ---
// O 'Pool' usa as informações que definimos no docker-compose.yml
const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'escola',
    password: '123456',
    port: 5432,
});

/**
 * Função para criar as tabelas no banco de dados se elas não existirem.
 * Vamos executá-la uma vez no início do script.
 */
async function criarTabelasSeNaoExistirem() {
    console.log("Verificando tabelas...");
    const client = await pool.connect(); // Pega uma conexão do pool
    try {
        // Criamos a tabela 'alunos'
        await client.query(`
            CREATE TABLE IF NOT EXISTS alunos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                idade INT,
                serie VARCHAR(50)
            );
        `);
        
        // Criamos a tabela 'medias'
        // 'aluno_id' é uma "Chave Estrangeira" que se liga ao 'id' da tabela 'alunos'
        await client.query(`
            CREATE TABLE IF NOT EXISTS medias (
                id SERIAL PRIMARY KEY,
                aluno_id INT REFERENCES alunos(id) ON DELETE CASCADE,
                materia VARCHAR(50) NOT NULL,
                media NUMERIC(4, 2) NOT NULL
            );
        `);
        console.log("Tabelas verificadas/criadas com sucesso.");
    } catch (error) {
        console.error("Erro ao criar tabelas:", error);
    } finally {
        client.release(); // Sempre libere o cliente de volta para o pool
    }
}

/**
 * Função SÍNCRONA (como a original) para pedir notas.
 * Não precisamos mudar nada aqui.
 */
function pedirNotas(materia: string, numNotas: number): number[] {
    console.log(`\n--- Notas de ${materia} ---`);
    const notas: number[] = [];
    for (let i = 1; i <= numNotas; i++) {
        let notaNum: number = NaN;
        do {
            const notaStr = input(`Digite a ${i}ª nota de ${materia}: `);
            if (notaStr !== null && notaStr !== '') {
                notaNum = parseFloat(notaStr);
            }
        } while (isNaN(notaNum));
        notas.push(notaNum);
    }
    return notas;
}

/**
 * Função SÍNCRONA (como a original) para calcular média.
 * Não precisamos mudar nada aqui.
 */
function calcularMedia(notas: number[]): number {
    const soma = notas.reduce((total, nota) => total + nota, 0);
    return soma / notas.length;
}

/**
 * Função ASSÍNCRONA para salvar os dados no banco de dados.
 * Esta é a nova parte principal.
 */
async function salvarResultados(
    nome: string,
    idade: number,
    serie: string,
    mediaGeo: number,
    mediaMat: number,
    mediaHist: number
) {
    console.log("\nSalvando dados no banco de dados...");
    const client = await pool.connect();

    try {
        // --- Inicia uma TRANSAÇÃO ---
        // Isso garante que ou TUDO é salvo, ou NADA é salvo.
        await client.query('BEGIN');

        // 1. Inserir o aluno e pegar o 'id' dele
        const insertAlunoQuery = `
            INSERT INTO alunos (nome, idade, serie) 
            VALUES ($1, $2, $3) 
            RETURNING id;
        `;
        // $1, $2, $3 são "placeholders" para evitar SQL Injection
        const alunoResult = await client.query(insertAlunoQuery, [nome, idade, serie]);
        const alunoId = alunoResult.rows[0].id;

        console.log(`Aluno '${nome}' salvo com ID: ${alunoId}`);

        // 2. Inserir as médias associadas a esse 'alunoId'
        const insertMediaQuery = `
            INSERT INTO medias (aluno_id, materia, media) 
            VALUES ($1, $2, $3);
        `;
        
        await client.query(insertMediaQuery, [alunoId, 'Geografia', mediaGeo]);
        await client.query(insertMediaQuery, [alunoId, 'Matemática', mediaMat]);
        await client.query(insertMediaQuery, [alunoId, 'História', mediaHist]);

        // 3. Se tudo deu certo, "comita" a transação (salva permanentemente)
        await client.query('COMMIT');
        
        console.log("Médias salvas com sucesso!");
        console.log("===================================");

    } catch (error) {
        // 4. Se algo deu errado, desfaz tudo (ROLLBACK)
        await client.query('ROLLBACK');
        console.error("Erro ao salvar dados. Transação desfeita.", error);
    } finally {
        // 5. Libera a conexão de volta para o pool
        client.release();
    }
}


/**
 * --- Função Principal (Main) ---
 * Transformamos o script principal em uma função 'async'
 * para que possamos usar 'await' dentro dela.
 */
async function main() {
    // 1. Prepara o banco (roda só na primeira vez)
    await criarTabelasSeNaoExistirem();

    // 2. Coleta de dados (igual ao código antigo)
    console.log("\n--- Cadastro de Aluno e Médias ---");
    const nome = input("Digite o nome do aluno: ") || "";
    const idadeStr = input("Digite a idade do aluno: ") || "";
    const serie = input("Digite a série do aluno: ") || "";
    const idade = parseInt(idadeStr); // Vai ser NaN se a string for vazia

    const notasGeografia = pedirNotas("Geografia", 8);
    const mediaGeografia = calcularMedia(notasGeografia);

    const notasMatematica = pedirNotas("Matemática", 8);
    const mediaMatematica = calcularMedia(notasMatematica);

    const notasHistoria = pedirNotas("História", 8);
    const mediaHistoria = calcularMedia(notasHistoria);

    // 3. Exibição (igual ao código antigo)
    console.log("\n===================================");
    console.log("      RESULTADO DO ALUNO      ");
    console.log("===================================");
    console.log(`Nome: ${nome}`);
    console.log(`Idade: ${idade}`);
    console.log(`Série: ${serie}`);
    console.log("-----------------------------------");
    console.log(`Média de Geografia: ${mediaGeografia.toFixed(2)}`);
    console.log(`Média de Matemática: ${mediaMatematica.toFixed(2)}`);
    console.log(`Média de História: ${mediaHistoria.toFixed(2)}`);

    // 4. Salvar no Banco (a nova parte)
    await salvarResultados(
        nome,
        idade,
        serie,
        mediaGeografia,
        mediaMatematica,
        mediaHistoria
    );

    // 5. Fechar o pool de conexões (encerra o programa)
    await pool.end();
    console.log("Conexão com o banco fechada.");
}

// --- Ponto de Entrada do Script ---
// Chamamos a função 'main' e tratamos qualquer erro global.
main().catch(error => {
    console.error("Ocorreu um erro inesperado:", error);
    pool.end(); // Garante que o pool feche mesmo se der erro
});