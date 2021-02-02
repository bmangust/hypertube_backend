import {Express} from 'express'
import TorrentSearchApi from 'torrent-search-api'
import * as utils from './utils'

export default function addHandlers(app: Express) {
    app.get('/find', (req, res) => {
        const category = req.query['category'].toString();
        const search = req.query['search'].toString();

        TorrentSearchApi.enablePublicProviders();

        TorrentSearchApi.search(search, category, 20)
            .then(torrents => {
                console.log(`Got ${torrents.length} torrents`)

                res.json(utils.createSuccessResponse(
                    torrents.map(item => ({title: item.title, magnet: item.magnet}))
                )).status(200)
            })
            .catch(e => {
                console.log(`Error getting torrents: ${e}`)
                res.json(utils.createErrorResponse(e)).status(500)
            })
    })
}