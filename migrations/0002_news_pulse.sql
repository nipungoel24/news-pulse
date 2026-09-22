create table if not exists articles (
  id text primary key,
  url text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  source_id text not null,
  source_name text not null,
  published_at timestamptz,
  ingested_at timestamptz not null default now()
);

create index if not exists articles_source_id_idx on articles (source_id);
create index if not exists articles_published_at_idx on articles (published_at);

create table if not exists clusters (
  id text primary key,
  label text not null,
  top_terms text not null default '',
  article_count integer not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  intensity double precision not null default 0,
  generation integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists clusters_active_idx on clusters (active, start_at);

create table if not exists cluster_articles (
  cluster_id text not null references clusters (id) on delete cascade,
  article_id text not null references articles (id) on delete cascade,
  primary key (cluster_id, article_id)
);

create index if not exists cluster_articles_article_idx on cluster_articles (article_id);

create table if not exists ingest_jobs (
  id text primary key,
  status text not null,
  stage text not null default '',
  message text not null default '',
  articles_seen integer not null default 0,
  articles_new integer not null default 0,
  clusters_built integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text
);

create table if not exists ingest_meta (
  key text primary key,
  value text not null
);
