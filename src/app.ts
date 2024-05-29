import express from 'express';
import cors from 'cors';
import { Ave } from './model/Ave';
import { Habitat } from './model/Habitat';
import { Atracao } from './model/Atracao';
import { DatabaseModel } from './model/DatabaseModel';
import AveController from './controller/AveController';

const server = express();
const port = 3000;

server.use(express.json());
server.use(cors());

const aveController = new AveController('', 0, '', 0);

// Rota padrão para testes (NÃO USAR EM AMBIENTE PRODUÇÃO)
server.get('/', (req, res) => {
    res.send('Hello World!');
});

server.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Informações: ${username} - ${password}`);
});

/**
 * Listar informações cadastradas no banco de dados
 */
// Listar todos as aves cadastradas
server.get('/aves', aveController.todos);

// Listar todos os habitats cadastradas
server.get('/habitats', async (req, res) => {
    // cria objeto habitats e atribui a ele o retorno do método listarHabitats
    const habitats = await Habitat.listarHabitats();

    // retorna a lista de habitats em formato json
    res.status(200).json(habitats);
});

// Listar todas as atrações cadastradas
server.get('/atracoes', async (req, res) => {
    // cria objeto atracoes e atribui a ele o retorno do método listarAtracoes
    const atracoes = await Atracao.listarAtracoes();

    // retorna a lista de atracoes em formato json
    res.status(200).json(atracoes);
});

/**
 * Cadastrar informações no sistema
 */
// Cadastra informações de uma nova ave
server.post('/novo/ave', aveController.novo);

// Cadastra informações de um novo habitat
server.post('/novo/habitat', async (req, res) => {
    // Desestruturando objeto recebido pelo front-end
    const { nomeHabitat } = req.body;

    // Instanciando objeto Habitat
    const novoHabitat = new Habitat(nomeHabitat);

    // Chama o método para persistir o habitat no banco de dados
    const result = await Habitat.cadastrarHabitat(novoHabitat);

    // Verifica se a query foi executada com sucesso
    if (result) {
        return res.status(200).json('Habitat cadastrado com sucesso');
    } else {
        return res.status(400).json('Não foi possível cadastrar o habitat no banco de dados');
    }
});

// Cadastra informações de uma nova atracao
server.post('/novo/atracao', async (req, res) => {
    // Desestruturando objeto recebido pelo front-end
    const { nomeAtracao, idHabitat } = req.body;

    // Instanciando objeto Ave
    const novaAtracao = new Atracao(nomeAtracao);

    let result = false;

    // verifica se o idHabitat não veio vazio do front-end
    if (idHabitat != undefined) {
        // Chama o método para persistir a atracao no banco de dados associando ao id
        result = await Atracao.cadastrarAtracao(novaAtracao, idHabitat);
    } else {
        // Chama o método para persistir a atracao no banco de dados
        result = await Atracao.cadastrarAtracao(novaAtracao);
    }

    // verifica se a query foi executada com sucesso
    if (result) {
        return res.status(200).json('Atração cadastrado com sucesso');
    } else {
        return res.status(400).json('Não foi possível cadastrar a atração no banco de dados');
    }
});

server.delete('/remover/animal', aveController.remover);

server.delete('/remover/atracao', async (req, res) => {
    const idAtracao = parseInt(req.query.idAtracao as string);

    const resultado = await Atracao.removerAtracao(idAtracao);

    if(resultado) {
        return res.status(200).json('Atração foi removida com sucesso');
    } else {
        return res.status(401).json('Erro ao remover atração');
    }
});

server.delete('/remover/habitat', async (req, res) => {
    const idHabitat = parseInt(req.query.idHabitat as string);

    const resultado = await Habitat.removerHabitat(idHabitat);

    if(resultado) {
        return res.status(200).json('Habitat foi removido com sucesso');
    } else {
        return res.status(401).json('Erro ao remover habitat');
    }
});

server.put('/atualizar/animal', aveController.atualizar);

server.put('/atualizar/habitat', async (req, res) => {
    // Desestruturando objeto recebido pelo front-end
    const { nomeHabitat } = req.body;
    const idHabitat = parseInt(req.query.idHabitat as string);

    // Instanciando objeto Habitat
    const novoHabitat = new Habitat(nomeHabitat);

    // Chama o método para persistir o habitat no banco de dados
    const result = await Habitat.atualizarHabitat(novoHabitat, idHabitat);

    // Verifica se a query foi executada com sucesso
    if (result) {
        return res.status(200).json('Habitat atualizado com sucesso');
    } else {
        return res.status(400).json('Não foi possível atualizar o habitat no banco de dados');
    }
});

server.put('/atualizar/atracao/:idAtracao', async (req, res) => {
    const idAtracao = parseInt(req.params.idAtracao);
    const { nomeAtracao, idHabitat } = req.body;

    // Criar nova instância de Atracao
    const novaAtracao = new Atracao(nomeAtracao);

    try {
        // Se idHabitat estiver presente na requisição, configurar o habitat da nova atração
        if (idHabitat) {
            const habitat = new Habitat(''); // Aqui você precisa criar uma instância de Habitat com os dados corretos
            novaAtracao.setHabitatAtracao(habitat);
        }

        // Chamar método de atualização da atração
        const result = await Atracao.atualizarAtracao(novaAtracao, idAtracao);

        // Verificar resultado da atualização
        if (result) {
            return res.status(200).json('Atração atualizada com sucesso');
        } else {
            return res.status(400).json('Não foi possível atualizar a atração no banco de dados');
        }
    } catch (error) {
        console.log('Erro ao atualizar atração:', error);
        return res.status(400).json('Erro interno ao atualizar atração');
    }
});

new DatabaseModel().testeConexao().then((resbd) => {
    if(resbd) {
        server.listen(port, () => {
            console.info(`Servidor executando no endereço http://localhost:${port}/`);
        })
    } else {
        console.log(`Não foi possível conectar ao banco de dados`);
    }
})