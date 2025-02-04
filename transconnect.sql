\echo 'Delete and recreate transconnect db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE transconnect;
CREATE DATABASE transconnect;
\connect transconnect

\i prisma/schema.prisma

\echo 'Delete and recreate transconnect_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE transconnect_test;
CREATE DATABASE transconnect_test;
\connect transconnect_test

\i prisma/schema.prisma