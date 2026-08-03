const express = require('express');
const path = require('path'); // Modulo nativo do Node para lidar com caminhos
const app = express();

// Constante para conectar banco de dados SQL
const sqlite3 = require('sqlite3').verbose();

//Criar arquivo no banco de dados chamado 'fazenda.db' na pasta do projeto!
const db = new sqlite3.Database('./fazenda.db', (erro) => {
    if (erro) console.error("Erro ao abrir o banco de dados:", error.message);
    else console.log("Conectado ao Banco de dados SQLite");
});

// Ensina o Node a criar a tabela automaticamente se ela não existir 
db.run(`CREATE TABLE IF NOT EXISTS tanques ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT,
  	nome TEXT,
  	peixe TEXT 
 )`);

// Tradutor para dados do Thunder Client / APIs (JSON)
app.use(express.json());
// Tradutor para dados de Formulários HTML
app.use(express.urlencoded({ extended: true}));
//Libere a pasta 'public' para acesso do navegador
app.use(express.static('public'));

app.get('/', (req, res) => {
    //res.sendFile envia um arquivo físico. _dirname pega a pasta atual
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


//Criando a rota salvar-tanque 
app.post('/salvar-tanque', (req, res) => {
    // 1. Pega os dados que vieram do formulário HTML
    const nomeTanque = req.body.nomeTanque;
    const especiePeixe = req.body.especiePeixe;

    // 2. Monta a ordem SQL (Cuidado com as aspas simples!)
    const comandoSQL = `INSERT INTO tanques (nome, peixe) VALUES ('${nomeTanque}', '${especiePeixe}')`;

    // 3. Pede para o banco executar a ordem
    db.run(comandoSQL, function(erro) {
        if (erro) {
            return res.send("Erro ao salvar no banco: " + erro.message);
        }
        console.log("Tanque salvo com o ID:", this.lastID);
        res.send("Sucesso! Tanque salvo no Banco de Dados!");
    });
});

app.get('/listar-tanques', (req, res) => {
    
    const comandoSQL = `SELECT * FROM tanques`;

    // db.all pega TODAS as linhas que o SELECT encontrar
    db.all(comandoSQL, [], (erro, linhas) => {
        if (erro) {
            return res.send("Erro ao ler o banco.");
        }
        // Devolve as linhas em formato JSON para o navegador ver
        res.json(linhas); 
    });
});
 
//Criando a rota Post que o formulário alimentacao 
app.post('/registrar-racao', (req, res) => {
    // req.body é o pacote que o formulário enviou
    const dadosDaRacao = req.body;
    
    // Imprimindo no terminal para provar que chegou
    console.log("ATENÇÃO! Nova alimentação registrada:");
    console.log("Tanque:", dadosDaRacao.tanque);
    console.log("Kg de Ração:", dadosDaRacao.quantidade);

    // Devolvendo uma resposta para o navegador não ficar carregando infinitamente
    res.send("Ração registrada com sucesso no sistema")
}); 

// Usamos app.delete para respeitar os verbos HTTP
app.delete('/apagar-tanque/:id', (req, res) => {
    //req.params pega o valor que vier na URL no :id
    const idDoTanque = req.params.id;

    //Montar o SQL com a cláusula WHERE
    const comandoSQL = `DELETE FROM tanques WHERE id = ${idDoTanque}`;

    db.run(comandoSQL, function(erro){
        if (erro) {
            return res.send("Erro ao apagar: " +  erro.message);
        }
        // Mostra quantas linhas foram afetadas no banco de dados
        if (this.changes === 0){
            return res.status(404).send("Tanque não encontrado!");
        }
        res.send(`Tanque número ${idDoTanque} foi apagado com sucesso!`);
    });
});

// Usamos app.put para atualizações
app.put('/atualizar-tanque/:id', (req, res) => {
    const idDoTanque = req.params.id;
    
    // Pegamos os novos dados que vêm do "corpo" da requisição
    const novoNome = req.body.nome;
    const novoPeixe = req.body.peixe;

    const comandoSQL = `UPDATE tanques SET nome = '${novoNome}', peixe = '${novoPeixe}' WHERE id = ${idDoTanque}`;

    db.run(comandoSQL, function(erro) {
        if (erro) return res.send("Erro ao atualizar.");
        res.send("Tanque atualizado com sucesso!");
    });
});

// ROTA PERIGOSA: Só para uso em laboratório!
app.get('/resetar-banco', (req, res) => {
    const status = false   
    const comandoSQL = `DROP TABLE IF EXISTS tanques`;

    if (status) {
    // db.run é usado para comandos que não retornam dados (como DROP, INSERT, UPDATE)
    db.run(comandoSQL, (erro) => {
        if (erro) {
            console.error("Erro ao apagar tabela:", erro);
            return res.send("Deu erro ao apagar: " + erro.message);
        }
        
        console.log("💥 Tabela 'tanques' foi completamente destruída!");
        res.send("Tabela apagada com sucesso! Reinicie o servidor para criá-la vazia novamente.");
    });
    }
});

app.listen(3000, () => console.log('Rodando...'));