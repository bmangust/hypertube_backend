export interface httpResponse {
  status: boolean;
  data: any;
}

export interface IGenres {
  Adventure: boolean;
  Arthouse: boolean;
  Action: boolean;
  Comedy: boolean;
  Comics: boolean;
  Detective: boolean;
  Drama: boolean;
  Fantasy: boolean;
  Family: boolean;
  Horror: boolean;
  Melodrama: boolean;
  Musical: boolean;
  Romance: boolean;
  'Sci-Fi': boolean;
  Sport: boolean;
  Thriller: boolean;
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
  name: string;
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
  country?: CountriesKeys[];
  pgRating: string;
  comments?: IComment[];
  commentIds?: string[];
  description?: string;
  photos?: string[];
  videos?: string[];
  moreLikeThis?: IMovie[];
  storyline?: string;
  directed?: IUser[];
  cast?: IUser[];
  writingCredits?: IUser[];
  produced?: IUser[];
  music?: IUser[];
  cinematography?: IUser[];
  filmEditing?: IUser[];
}

export interface IComment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
}

export interface IUser {
  name: string;
  photo?: string[];
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
