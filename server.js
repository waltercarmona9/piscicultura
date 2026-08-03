const express = require('express');
const path = require('path'); // Modulo nativo do Node para lidar com caminhos
const app = express();

// Constante para conectar banco de dados SQL
const sqlite3 = require('sqlite3').verbose();

// Criar arquivo no banco de dados chamado 'fazenda.db' na pasta do projeto!
const db = new sqlite3.Database('./fazenda.db', (erro) => {
    if (erro) console.error("Erro ao abrir o banco de dados:", erro.message);
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
app.use(express.urlencoded({ extended: true }));
// Libere a pasta 'public' para acesso do navegador
app.use(express.static('public'));

app.get('/', (req, res) => {
    // res.sendFile envia um arquivo físico. __dirname pega a pasta atual
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Criando a rota salvar-tanque (CORRIGIDA CONTRA SQL INJECTION)
app.post('/salvar-tanque', (req, res) => {
    const nomeTanque = req.body.nomeTanque;
    const especiePeixe = req.body.especiePeixe;

    // O uso de '?' protege o banco de dados contra invasões
    const comandoSQL = `INSERT INTO tanques (nome, peixe) VALUES (?, ?)`;

    db.run(comandoSQL, [nomeTanque, especiePeixe], function(erro) {
        if (erro) {
            return res.status(500).send("Erro ao salvar no banco: " + erro.message);
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
            return res.status(500).send("Erro ao ler o banco.");
        }
        // Devolve as linhas em formato JSON para o navegador ver
        res.json(linhas); 
    });
});
 
// Criando a rota Post que o formulário alimentacao 
app.post('/registrar-racao', (req, res) => {
    const dadosDaRacao = req.body;
    
    console.log("ATENÇÃO! Nova alimentação registrada:");
    console.log("Tanque:", dadosDaRacao.tanque);
    console.log("Kg de Ração:", dadosDaRacao.quantidade);

    res.send("Ração registrada com sucesso no sistema");
}); 

// Usamos app.delete para respeitar os verbos HTTP (CORRIGIDA CONTRA SQL INJECTION)
app.delete('/apagar-tanque/:id', (req, res) => {
    const idDoTanque = req.params.id;

    const comandoSQL = `DELETE FROM tanques WHERE id = ?`;

    db.run(comandoSQL, [idDoTanque], function(erro){
        if (erro) {
            return res.status(500).send("Erro ao apagar: " +  erro.message);
        }
        if (this.changes === 0){
            return res.status(404).send("Tanque não encontrado!");
        }
        res.send(`Tanque número ${idDoTanque} foi apagado com sucesso!`);
    });
});

// Usamos app.put para atualizações (CORRIGIDA CONTRA SQL INJECTION)
app.put('/atualizar-tanque/:id', (req, res) => {
    const idDoTanque = req.params.id;
    const novoNome = req.body.nome;
    const novoPeixe = req.body.peixe;

    const comandoSQL = `UPDATE tanques SET nome = ?, peixe = ? WHERE id = ?`;

    db.run(comandoSQL, [novoNome, novoPeixe, idDoTanque], function(erro) {
        if (erro) return res.status(500).send("Erro ao atualizar.");
        if (this.changes === 0) return res.status(404).send("Tanque não encontrado.");
        res.send("Tanque até atualizado com sucesso!");
    });
});

// ROTA PERIGOSA: Só para uso em laboratório!
app.get('/resetar-banco', (req, res) => {
    const permitirReset = false; // Mudado o nome para clareza
    const comandoSQL = `DROP TABLE IF EXISTS tanques`;

    if (permitirReset) {
        db.run(comandoSQL, (erro) => {
            if (erro) {
                console.error("Erro ao apagar tabela:", erro);
                return res.status(500).send("Deu erro ao apagar: " + erro.message);
            }
            console.log("💥 Tabela 'tanques' foi completamente destruída!");
            res.send("Tabela apagada com sucesso! Reinicie o servidor para criá-la vazia novamente.");
        });
    } else {
        res.status(403).send("Operação não permitida no momento.");
    }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000...'));
