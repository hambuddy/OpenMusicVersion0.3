const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');
const InvariantError = require('../../exceptions/InvariantError');

class AlbumsService {
    constructor(cacheService) {
        this._pool = new Pool();
        this._cacheService = cacheService;
    }
    
    async addAlbum({ name, year }) {
        const id = `album-${nanoid(16)}`;
        const query = {
          text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
          values: [id, name, year],
        };
        const result = await this._pool.query(query);
        if (!result.rows[0].id) {
          throw new InvariantError('Album gagal ditambahkan');
        }
        return result.rows[0].id;
    }

    async getAlbumById(id) {
        const queryAlbum = {
            text: 'SELECT id, name, year, cover_url FROM albums WHERE id = $1',
            values: [id],
        };
        const resultAlbum = await this._pool.query(queryAlbum);
        if (!resultAlbum.rows.length) {
            throw new NotFoundError('Album tidak ditemukan');
        }
        const querySong = {
            text: 
            `SELECT songs.id, songs.title, songs.performer 
            FROM albums 
            JOIN songs ON albums.id = songs."albumId"
            WHERE albums.id = $1`,
            values: [id],
        };
        const resultSong = await this._pool.query(querySong);
        const res = {
            albums: resultAlbum.rows[0],
            songs: resultSong.rows
        }
        return res;
    }

    async editAlbumById(id, { 
        name, year 
    }) {
        const query = {
            text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
            values: [
                name, 
                year, 
                id
            ],
        };
     
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
        }
    }

    async deleteAlbumById(id) {
        const query = {
            text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
            values: [id],
        };

        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('Gagal menghapus album, Id tidak ditemukan');
        }
    }
    
    async updateAlbumCover(id, coverUrl) {
        const query = {
            text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
            values: [coverUrl, id],
        };
        const result = await this._pool.query(query);
        if (!result.rowCount) {
            throw new NotFoundError('Album gagal diperbaharui, album id tidak ditemukan');
        }
    }
      
    async addUserAlbumLikeById(albumId, userId) {
        const id = `userlikealbum-${nanoid(16)}`;
        const isLiked = {
            text: `SELECT id FROM user_album_like WHERE user_id = $1 AND album_id = $2`,
            values: [userId, albumId],
        };
        
        const resultIsLiked = await this._pool.query(isLiked);
        
        if (!resultIsLiked.rows.length) {
            const query = {
                text: 'INSERT INTO user_album_like VALUES($1, $2, $3) RETURNING id',
                values: [id, userId, albumId],
            };
        
            const result = await this._pool.query(query);
            
            if (!result.rows[0].id) {
                throw new InvariantError('Gagal menambahkan like user album');
            }
            await this._cacheService.delete(`userlikealbum:${albumId}`);
        } else { 
            throw new InvariantError('Gagal menambahkan like user album');
        }
    }
    
    async deleteLike(albumId, userId) {
        const isLiked = {
            text: `SELECT id FROM user_album_like WHERE user_id = $1 AND album_id = $2`,
            values: [userId, albumId],
        };
        
        const resultIsLiked = await this._pool.query(isLiked);
        
        if (resultIsLiked.rows.length) {
            const query = {
                text: `DELETE FROM user_album_like WHERE user_id = $1 AND album_id = $2 RETURNING id`,
                values: [userId, albumId],
            };
          
            const result = await this._pool.query(query);
            if (!result.rows.length) {
                throw new NotFoundError('Gagal menghapus like');
            }
            await this._cacheService.delete(`userlikealbum:${albumId}`);
        }
    }
    
    async getUserAlbumLikeById(albumId) {
        try {
            const result = await this._cacheService.get(`userlikealbum:${albumId}`);
            return {
                res: JSON.parse(result),
                inMemory: 'cache',
            };
        } catch {
            const query = {
                text: 'SELECT COUNT(id) FROM user_album_like WHERE album_id = $1',
                values: [albumId],
            };
            const result = await this._pool.query(query);
            if (!result.rows.length) {
                throw new NotFoundError('Gagal mendapatkan jumlah like');
            }
            await this._cacheService.set(`userlikealbum:${albumId}`, JSON.stringify(result.rows[0].count));
            return {
                res: result.rows[0].count,
                inMemory: false,
            };
        }
    }
}

module.exports = AlbumsService;