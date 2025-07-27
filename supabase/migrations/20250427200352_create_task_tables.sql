create table task (
    uid uuid not null primary key as identity,
    name text not null,
    slug text not null,
    content: jsonb not null,
    owner_user_uid uuid not null references auth.users (uid),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table task_log_item (
    uid uuid not null primary key as identity,
    task_uid uuid not null references task (uid),
    completed_by_user_uid uuid not null references auth.users (uid),
    completed_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);