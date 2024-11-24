const mapSongDBToModel = ({
    id,
    title,
    performer,
}) => ({
    id,
    title,
    performer,
})

const mapDetailSongDBToModel = ({
    id, 
    title, 
    year,
    genre,
    performer,
    duration,
    album_id,
}) => ({
    id, 
    title, 
    year,
    genre,
    performer,
    duration,
    albumId: album_id,
});

const mapDBAlbumSongService = ({
    id,
    name,
    year,
    cover_url, 
}, songs ) => ({
    id, 
    name, 
    year,
    coverUrl: cover_url,
    songs: songs,
});

module.exports = { mapDetailSongDBToModel, mapSongDBToModel, mapDBAlbumSongService };