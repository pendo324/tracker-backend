const Joi = require('joi');
const db = require('./../db');

// music schema
const musicSchema = Joi.object().keys({
  title: Joi.string()
    .min(1)
    .required(),
  year: Joi.number()
    .min(1650)
    .max(new Date().getFullYear() + 5),
  description: Joi.string().optional(),
  musicReleaseType: Joi.string().length(26)
});

// music info schema
const musicInfoSchema = Joi.object().keys({
  title: Joi.string()
    .min(1)
    .required(),
  description: Joi.string().optional(),
  encoding: Joi.string().min(1),
  quality: Joi.string().length(26)
});

const validateMusic = async ({
  release,
  musicReleaseTypes,
  musicQualities
}) => {
  // verifiy release.music
  if (release.music instanceof Object) {
    const { error: musicError } = Joi.validate(release.music, musicSchema);
    if (musicError !== null) {
      // throw new Error('Invalid music object.', musicError);
      throw new Error(musicError);
    }
    if (
      !musicReleaseTypes
        .map((rt) => rt.id)
        .includes(release.music.musicReleaseType)
    ) {
      throw new Error('Music entry contains invalid release type.');
    }
  } else {
    const music = await db.getMusic(release.music);
    if (music.rows.length !== 1) {
      throw new Error('Invalid music id.');
    }
  }

  // verifiy release.info
  const { error: musicInfoError } = Joi.validate(release.info, musicInfoSchema);
  if (musicInfoError !== null) {
    // throw new Error('Invalid music info.', musicInfoError);
    throw new Error(musicInfoError);
  }
  if (!musicQualities.map((mq) => mq.id).includes(release.info.quality)) {
    throw new Error('Info contains invalid quality.');
  }
};

const animeSchema = Joi.object().keys({
  name: Joi.string()
    .min(1)
    .required(),
  description: Joi.string().optional(),
  season: Joi.string().optional(),
  episode: Joi.string().optional()
});

const TVShowSchema = animeSchema;

const validateAnime = async ({ release }) => {
  if (release.anime instanceof Object) {
    const { error: animeError } = Joi.validate(release.anime, animeSchema);
    if (animeError !== null) {
      // throw new Error('Invalid music object.', musicError);
      throw new Error(animeError);
    }
  } else {
    const anime = await db.getAnime(release.anime);
    if (anime.rows.length !== 1) {
      throw new Error('Invalid music id.');
    }
  }

  const { error: animeInfoError } = Joi.validate(release.info, videoInfoSchema);
  if (animeInfoError !== null) {
    // throw new Error('Invalid music object.', musicError);
    throw new Error(animeInfoError);
  }
};

const videoInfoSchema = Joi.object().keys({
  title: Joi.string()
    .min(1)
    .required(),
  description: Joi.string().optional(),
  quality: Joi.string().length(26)
});

const movieSchema = Joi.object().keys({
  name: Joi.string()
    .min(1)
    .required(),
  description: Joi.string().optional(),
  year: Joi.number().required()
});

const validateMovie = async ({ release }) => {
  if (release.movie instanceof Object) {
    const { error: movieError } = Joi.validate(release.movie, movieSchema);
    if (movieError !== null) {
      // throw new Error('Invalid music object.', musicError);
      throw new Error(movieError);
    }
  } else {
    const movie = await db.getMovie(release.movie);
    if (movie.rows.length !== 1) {
      throw new Error('Invalid movie id.');
    }
  }

  const { error: movieInfoError } = Joi.validate(release.info, videoInfoSchema);
  if (movieInfoError !== null) {
    // throw new Error('Invalid music object.', musicError);
    throw new Error(movieInfoError);
  }
};

const validateTV = async ({ release }) => {
  if (release.tv instanceof Object) {
    const { error: tvError } = Joi.validate(release.tv, TVShowSchema);
    if (tvError !== null) {
      // throw new Error('Invalid music object.', musicError);
      throw new Error(tvError);
    }
  } else {
    const tv = await db.getAnime(release.tv);
    if (tv.rows.length !== 1) {
      throw new Error('Invalid TV id.');
    }
  }

  const { error: movieInfoError } = Joi.validate(release.info, videoInfoSchema);
  if (movieInfoError !== null) {
    // throw new Error('Invalid music object.', musicError);
    throw new Error(movieInfoError);
  }
};

const softwareSchema = Joi.object().keys({
  name: Joi.string()
    .min(1)
    .required(),
  description: Joi.string().optional(),
  operatingSystem: Joi.string().optional()
});

const validateSoftware = async ({ release }) => {
  const { error: softwareError } = Joi.validate(
    release.software,
    softwareSchema
  );
  if (softwareError !== null) {
    // throw new Error('Invalid music object.', musicError);
    throw new Error(softwareError);
  }
};

const artistSchema = Joi.object()
  .keys({
    name: Joi.string()
      .min(1)
      .optional(),
    description: Joi.string().optional(),
    primary: Joi.boolean().required(),
    id: Joi.string().length(26)
  })
  .with('name', 'description')
  .without('id', 'name')
  .without('id', 'description');

const validateArtist = async (artist) => {
  const { error: artistError } = Joi.validate(artist, artistSchema);
  if (artistError !== null) {
    throw new Error(artistError);
  }
  // make sure ids are valid
  if (Object.prototype.hasOwnProperty.call(artist, 'id')) {
    const anime = await db.getArtist(artist.id);
    if (anime.rows.length !== 1) {
      throw new Error('Invalid artist id.');
    }
  }
};

module.exports = {
  validateAnime,
  validateArtist,
  validateMovie,
  validateMusic,
  validateSoftware,
  validateTV
};
