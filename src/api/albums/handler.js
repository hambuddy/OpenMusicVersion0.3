const autoBind = require('auto-bind');
const {mapDBAlbumSongService} = require('../../utils/index');

class AlbumsHandler {
    constructor(albumsService, songsService, storageService, validator) {
        this._albumsService = albumsService;
        this._songsService = songsService;
        this._storageService = storageService;
        this._validator = validator;
    
        autoBind(this);
    }

    async postAlbumHandler(request, h) {
        this._validator.validateAlbumPayload(request.payload);
        const { name, year } = request.payload;
        const albumId = await this._albumsService.addAlbum({ name, year });
        
        const response = h.response({
            status: "success",
            message: "Album berhasil ditambahkan",
            data: {
                albumId,
            },
        });

        response.code(201);
        return response;
    }

    async getAlbumByIdHandler(request) {
        const { id } = request.params;
        const album = await this._albumsService.getAlbumById(id);
    
        if (!album || !album.albums || !album.songs) {
            throw new Error('Album data is missing or incomplete');
        }
    
        const result = mapDBAlbumSongService(album.albums, album.songs);
    
        return {
            status: 'success',
            data: {
                album: result, 
            },
        };
    }

    async putAlbumByIdHandler(request, h) {
        this._validator.validateAlbumPayload(request.payload);
        const { id } = request.params;
        await this._albumsService.editAlbumById(id, request.payload);
        
        const response = h.response({
            status: 'success',
            message: 'Album berhasil diperbarui',
        });
        
        response.code(200);
        return response;
    }

    async deleteAlbumByIdHandler(request, h) {
        const { id } = request.params;
        await this._albumsService.deleteAlbumById(id);

        const response = h.response({
            status: 'success',
            message: 'Album berhasil dihapus',
        });

        response.code(200);
        return response;
    }
    
    async postUserLikeAlbumByIdHandler(request, h) {
        const {id: userId} = request.auth.credentials;
        const {id: albumId} = request.params;
        await this._albumsService.getAlbumById(albumId);
        await this._albumsService.addUserAlbumLikeById(albumId, userId);
        const response = h.response({
            status: 'success',
            message: 'Operasi sukses dilakukan',
        });
        response.code(201);
        return response;
    }
    
    async deleteUserAlbumLikesByIdHandler(request, h){
        const {id: userId} = request.auth.credentials;
        const {id: albumId} = request.params;
    
        await this._albumsService.getAlbumById(albumId);
        await this._albumsService.deleteLike(albumId, userId);
    
        const response = h.response({
            status: 'success',
            message: 'Operasi sukses dilakukan',
        });
        return response;
    }
    
    async getUserAlbumLikeHandler(request, h){
        const {id} = request.params;
        const {res, inMemory} = await this._albumsService.getUserAlbumLikeById(id);
        const likes = parseInt(res);
        if (inMemory){
            const response = h.response({
                status: 'success',
                message: 'Operasi sukses dilakukan',
                data: {
                    likes: likes,
                },
            });
            response.header('X-Data-Source', inMemory);
            return response;    
        }
        const response = h.response({
            status: 'success',
            message: 'Operasi sukses dilakukan',
            data: {
                likes: likes,
            },
        });
        return response;
    }
}

module.exports = AlbumsHandler;