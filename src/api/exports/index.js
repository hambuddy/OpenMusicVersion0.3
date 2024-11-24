const ExportsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
    name: 'export',
    version: '1.0.0',
    register: async (server, {
        producerService, 
        playlistsService, 
        validator
    }) => {
        const exportHandler = new ExportsHandler(
            producerService, 
            playlistsService, 
            validator
        );
        server.route(routes(exportHandler));
    },
};