require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt')
const ClientError = require('./exceptions/ClientError');
//songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');
//albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService')
const AlbumsValidator = require('./validator/albums');
//users
const users = require('./api/users');
const UsersValidator = require('./validator/users');
const UsersService = require('./services/postgres/UsersService');
//authtentication
const authentications = require('./api/authentication');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationService = require('./services/postgres/AuthenticationsService');
//playlists
const playlists = require('./api/playlists');
const PlaylistsValidator = require('./validator/playlists');
const PlaylistService = require('./services/postgres/PlaylistsService');
//activities
const activities = require('./api/activities');
const PlaylistSongActivitiesService = require('./services/postgres/PlaylistSongActivitiesService');
//collaborations
const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationService = require('./services/postgres/CollaborationsService');

const init = async () => {
    const collaborationsService = new CollaborationService();
    const albumsService = new AlbumsService();
    const songsService = new SongsService();
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationService();
    const playlistsService = new PlaylistService(collaborationsService);
    const activitiesService = new PlaylistSongActivitiesService();

    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        debug: {
            request:['error'] ,
        },
        routes: {
            cors: {
            origin: ["*"],
            },
        },
    });

    await server.register([
        {
            plugin: Jwt,
        },
    ]);

    server.auth.strategy('openmusic_jwt', 'jwt', {
        keys: process.env.ACCESS_TOKEN_KEY,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: process.env.ACCESS_TOKEN_AGE,
        },
        validate: (artifacts) => ({
            isValid: true,
            credentials: {
                id: artifacts.decoded.payload.id,
            },
        }),
    });

    await server.register([
        {
            plugin: albums,
            options: {
                service: albumsService,
                validator: AlbumsValidator,
            },
        },
        {
            plugin: songs,
            options: {
                service: songsService,
                validator: SongsValidator,
            },
        },
        {
            plugin: users,
            options: {
                service: usersService,
                validator: UsersValidator,
            },
        },
        {
            plugin: authentications,
            options: {
                authenticationsService,
                usersService,
                tokenManager: TokenManager,
                validator: AuthenticationsValidator,
            },
        },
        {
            plugin: playlists,
            options: {
                playlistsService,
                songsService,
                activitiesService,
                validator: PlaylistsValidator,
            },
        },
        {
            plugin: activities,
            options: {
                playlistsService,
                activitiesService,
            },
        },
        {
            plugin: collaborations,
            options: {
                collaborationsService,
                playlistsService,
                usersService,
                validator: CollaborationsValidator,
            },
        },
    ]);
    
    server.ext('onPreResponse', (request, h) => {
        const { response } = request;
            if (response instanceof Error) {
                if (response instanceof ClientError) {
                    const newResponse = h.response({
                    status: 'fail',
                    message: response.message,
                    });
                    newResponse.code(response.statusCode);
                    return newResponse;
                }
                if (!response.isServer) {
                    return h.continue;
                }
                const newResponse = h.response({
                    status: 'error',
                    message: 'Internal server error',
                });
                
                newResponse.code(500);
                return newResponse;
            }

        return h.continue;
    });
    
    await server.start();
    console.log(`Server running at ${server.info.uri}`);
};

init();