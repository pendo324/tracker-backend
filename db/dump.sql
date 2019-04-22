create database tracker
	with owner postgres;

create table blogposts
(
	id char(26) not null
		constraint blogposts_pk
			primary key,
	title varchar not null,
	content varchar not null,
	timestamp timestamp not null
);

alter table blogposts owner to postgres;

create table users
(
	id char(26) not null
		constraint users_pk
			primary key,
	username varchar not null,
	password_hash varchar(60) not null,
	email varchar(255) not null,
	activated boolean not null
);

alter table users owner to postgres;

create table torrents
(
	id varchar(26) not null
		constraint torrents_pk
			primary key,
	file_size integer not null,
	original_file_name varchar not null,
	file_path varchar not null,
	files jsonb,
	uploader_id char(26) not null
		constraint torrents_users_id_fk
			references users
);

alter table torrents owner to postgres;

create unique index users_id_uindex
	on users (id);

create table activation_codes
(
	id char(26),
	user_id char(26) not null
		constraint activation_codes_users_id_fk
			references users,
	activation_code varchar(64) not null
);

alter table activation_codes owner to postgres;

create table video_qualities
(
	id char(26) not null
		constraint video_qualities_pk
			primary key,
	quality varchar not null
);

alter table video_qualities owner to postgres;

create table video_releases
(
	id char(26) not null
		constraint video_releases_pk
			primary key,
	video_id char(26) not null,
	torrent_id char(26) not null
		constraint video_releases_torrents_id_fk
			references torrents,
	quality char(26)
		constraint video_releases_video_qualities_id_fk
			references video_qualities,
	title varchar not null,
	description varchar
);

alter table video_releases owner to postgres;

create unique index video_releases_torrent_id_uindex
	on video_releases (torrent_id);

create unique index video_qualities_quality_uindex
	on video_qualities (quality);

create table movies
(
	id char(26) not null
		constraint movies_pk
			primary key,
	name varchar not null,
	description varchar not null,
	year integer not null
);

alter table movies owner to postgres;

create table tv_shows
(
	id char(26) not null
		constraint tv_shows_pk
			primary key,
	name varchar not null,
	season integer,
	description varchar
);

alter table tv_shows owner to postgres;

create table anime
(
	id char(26) not null
		constraint anime_pk
			primary key,
	name varchar not null,
	season integer,
	description varchar
);

alter table anime owner to postgres;

create table games
(
	id char(26) not null
		constraint games_pk
			primary key,
	name varchar not null,
	operating_system varchar,
	description varchar,
	torrent_id char(26) not null
		constraint games_torrents_id_fk
			references torrents
);

alter table games owner to postgres;

create unique index games_torrent_id_uindex
	on games (torrent_id);

create table software
(
	id char(26) not null
		constraint software_pk
			primary key,
	name varchar not null,
	operating_system varchar,
	description varchar,
	torrent_id char(26) not null
		constraint software_torrents_id_fk
			references torrents
);

alter table software owner to postgres;

create table music_qualities
(
	id char(26) not null
		constraint music_qualities_pk
			primary key,
	quality varchar not null
);

alter table music_qualities owner to postgres;

create unique index music_qualities_quality_uindex
	on music_qualities (quality);

create table artists
(
	id char(26) not null
		constraint artists_pk
			primary key,
	name varchar not null,
	description varchar
);

alter table artists owner to postgres;

create table music
(
	id char(26) not null
		constraint music_pk
			primary key,
	title varchar not null,
	year integer not null,
	description varchar,
	music_release_id char(26) not null
);

alter table music owner to postgres;

create table music_releases
(
	id char(26) not null
		constraint music_releases_pk
			primary key,
	encoding varchar,
	quality char(26) not null
		constraint music_releases_music_qualities_id_fk
			references music_qualities,
	music_id char(26) not null
		constraint music_releases_music_id_fk
			references music,
	torrent_id char(26) not null
		constraint music_releases_torrents_id_fk
			references torrents,
	title varchar not null,
	description varchar
);

alter table music_releases owner to postgres;

create table music_artists
(
	music_id char(26) not null
		constraint music_artists_music_id_fk
			references music,
	artist_id char(26) not null
		constraint music_artists_artists_id_fk
			references artists,
	is_primary boolean not null,
	constraint music_artists_pk
		primary key (music_id, artist_id)
);

alter table music_artists owner to postgres;

create table music_release_types
(
	id char(26) not null
		constraint music_release_types_pk
			primary key,
	release_type varchar not null
);

alter table music_release_types owner to postgres;

create unique index music_release_types_release_type_uindex
	on music_release_types (release_type);

