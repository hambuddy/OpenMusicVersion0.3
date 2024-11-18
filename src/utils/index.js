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

module.exports = { mapDetailSongDBToModel, mapSongDBToModel};