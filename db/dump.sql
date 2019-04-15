create database tracker
	with owner postgres;

create table groups
(
	id varchar(26) not null
		constraint groups_pk
			primary key,
	artist varchar not null,
	album varchar not null,
	original_release_year integer not null
);

alter table groups owner to postgres;

create table torrents
(
	id varchar(26) not null
		constraint torrents_pk
			primary key,
	group_id varchar(26) not null
		constraint torrents_groups_id_fk
			references groups,
	file_size integer not null,
	original_file_name varchar not null,
	file_path varchar not null,
	files jsonb,
	release_type varchar not null,
	format varchar not null,
	bitrate integer not null,
	media varchar not null
);

alter table torrents owner to postgres;

create table blogposts
(
	id varchar(26) not null
		constraint blogposts_pk
			primary key,
	title varchar not null,
	content varchar not null,
	timestamp timestamp not null
);

alter table blogposts owner to postgres;

create table users
(
	id varchar(26) not null
		constraint users_pk
			primary key,
	username varchar not null,
	password_hash varchar not null,
	email varchar not null,
	activation_code varchar,
	activated boolean not null
);

alter table users owner to postgres;

create unique index users_id_uindex
	on users (id);

