class ExportsHandler {
    constructor(service, playlistsService, validator) {
        this._service = service;
        this._playlistService = playlistsService;
        this._validator = validator;
    }
  
    async postExportPlaylistHandler(request, h) {
        this._validator.validateExportPlaylistPayload(request.payload);
    
        const {playlistId} = request.params;
        const {id: userId} = request.auth.credentials;
    
        await this._playlistService.verifyPlaylistAccess(playlistId, userId);
    
        const message = {
            playlistId,
            targetEmail: request.payload.targetEmail,
        };
    
        await this._service.sendMessage('export:playlist', JSON.stringify(message));
    
        const response = h.response({
            status: 'success',
            message: 'Permintaan Anda sedang kami proses',
        });
        response.code(201);
        return response;
    }
}
  
module.exports = ExportsHandler;