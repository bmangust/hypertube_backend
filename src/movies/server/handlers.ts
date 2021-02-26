import { Express } from 'express';
import { createSuccessResponse, createErrorResponse } from './utils';
import log from '../logger/logger';
import { IComment } from '../model/model';
import {
  deleteComment,
  insertComment,
  selectCommentById,
  selectCommentsByMovieID,
  updateComment,
} from '../db/postgres/comments';
import {
  getMovieInfo,
  getMovies,
  IRating,
  updateMovieRating,
} from '../db/postgres/movies';

export function addMoviesHandlers(app: Express) {
  app.get('/movies', async (req, res) => {
    log.trace(req);
    const limit = +req.query.limit || 5;
    const offset = +req.query.offset || 0;
    const id = (req.query.id as string) || null;

    try {
      if (id) {
        const movie = await getMovieInfo(id);
        log.debug('[GET /movies] movieById:', movie);
        if (movie) res.json(createSuccessResponse([movie])).status(200);
        else res.json(createSuccessResponse(null)).status(200);
        return;
      }

      const movies = await getMovies(limit, offset);
      if (movies) res.json(createSuccessResponse(movies)).status(200);
      else res.json(createSuccessResponse(null)).status(200);
    } catch (e) {
      log.error(`Error getting movies: ${e}`);
      res.json(createErrorResponse('Error getting movies')).status(500);
    }
  });
}

export function addRatingHandlers(app: Express) {
  app.patch('/rating', async (req, res) => {
    const headers = req.headers;
    const cookies = req.cookies;
    log.debug(req.body, headers, cookies);

    try {
      // if (!headers.accessToken)
      //   //&& checkToken(headers.accessToken))
      //   return res.json(createErrorResponse('Not authorized')).status(401);
      const rating = (+req.body?.rating as IRating) || null;
      const id = (req.body?.id as string) || null;
      log.debug(`rating: ${rating}, id: ${id}`);
      if (rating === null || !id)
        return res
          .json(createErrorResponse('ID and RATING are required'))
          .status(400);
      const newRating = await updateMovieRating(id, rating);
      if (newRating) res.json(createSuccessResponse(newRating)).status(200);
      else res.json(createSuccessResponse(null)).status(200);
    } catch (e) {
      log.error(`Error getting movies: ${e}`);
      res.json(createErrorResponse('Error getting movies')).status(500);
    }
  });
}

export function addCommentsHandlers(app: Express) {
  app.get('/comments', async (req, res) => {
    log.trace(req);
    const limit = +req.query.limit || 5;
    const offset = +req.query.limit || 0;
    const movieid = req.query.movieid as string;
    try {
      const comments = await selectCommentsByMovieID(movieid, limit, offset);
      res.json(createSuccessResponse(comments)).status(200);
    } catch (e) {
      log.error(`Error getting comments: ${e}`);
      res.json(createErrorResponse('Error getting comments')).status(500);
    }
  });
  app.post('/comment', async (req, res) => {
    log.trace(req);
    try {
      const comment = req.body as IComment;
      const newComment = (await insertComment(comment)).rows[0] as IComment;
      if (!newComment)
        return res
          .json(createErrorResponse('Error posting comment'))
          .status(500);
      const result = await selectCommentById(newComment.id);
      log.debug(result);
      res.json(createSuccessResponse(result)).status(200);
    } catch (e) {
      log.error(`Error posting comment: ${e}`);
      res.json(createErrorResponse('Error posting comment')).status(500);
    }
  });
  app.patch('/comment', async (req, res) => {
    log.trace(req);
    try {
      const comment = req.body as IComment;
      const result = await updateComment(comment);
      if (result) res.json(createSuccessResponse(result.rows[0])).status(200);
      else res.json(createErrorResponse('Comment not found')).status(404);
    } catch (e) {
      log.error(`Error posting comment: ${e}`);
      res.json(createErrorResponse('Error posting comment')).status(500);
    }
  });
  app.delete('/comment', async (req, res) => {
    log.trace(req.query, req.params);
    try {
      const { id } = req.query;
      if (typeof id === 'string') {
        const result = await deleteComment(parseInt(id));
        if (result.rowCount)
          res.json(createSuccessResponse(result.rows[0])).status(200);
        else res.json(createErrorResponse('Comment not found')).status(404);
      }
    } catch (e) {
      log.error(`Error posting comment: ${e}`);
      res.json(createErrorResponse('Error posting comment')).status(500);
    }
  });
}
