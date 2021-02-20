export interface httpResponse {
  status: boolean;
  data: any;
}

export interface IGenres {
  Action: boolean;
  Adventure: boolean;
  Animation: boolean;
  Biography: boolean;
  Comedy: boolean;
  Crime: boolean;
  Documentary: boolean;
  Drama: boolean;
  Family: boolean;
  Fantasy: boolean;
  'Film Noir': boolean;
  History: boolean;
  Horror: boolean;
  Music: boolean;
  Mystery: boolean;
  Romance: boolean;
  'Sci-Fi': boolean;
  Short: boolean;
  Sport: boolean;
  Superhero: boolean;
  Thriller: boolean;
  War: boolean;
  Western: boolean;
}
export type GenresKeys = keyof IGenres;

export interface ICountries {
  Australia: boolean;
  Canada: boolean;
  France: boolean;
  Germany: boolean;
  'Great Britain': boolean;
  India: boolean;
  Japan: boolean;
  Russia: boolean;
  Spain: boolean;
  USA: boolean;
  USSR: boolean;
  other: boolean;
}
export type CountriesKeys = keyof ICountries;

export interface IMovie {
  id: string;
  title: string;
  img: string;
  src: string;
  info: IMovieInfo;
}

export interface IMovieInfo {
  avalibility: number;
  year: number;
  genres: GenresKeys[];
  rating: number;
  views: number;
  length: number;
  pgRating: string;
  countries?: string[];
  comments?: IComment[];
  commentIds?: string[];
  description?: string;
  photos?: string[];
  videos?: string[];
  moreLikeThis?: IMovie[];
  storyline?: string;
  directors?: string;
  directorList?: IUser[];
  stars?: string;
  cast?: IUser[];
  keywords?: string[];
}

export interface IComment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
}

export interface IUser {
  id: string;
  name: string;
  image?: string;
  asCharacter?: string;
  knownFor?: IMovie[];
  filmography?: IFilmography[];
  otherWorks?: string[];
  publicityListings?: string[];
  ofiicialSites?: string[];
  alternateNames?: string[];
  starSign?: string;
  born?: number;
  bornPlace?: string;
  birthName?: string;
  height?: number;
  bio?: string;
  tradeMark?: string[];
  trivia?: string[];
  personalQuotes?: string[];
}

export interface IFilmography {
  id?: string;
  job: string; //'actor', 'director'...
  movies: IMovie[];
}
