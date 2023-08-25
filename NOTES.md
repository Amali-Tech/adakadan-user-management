docker run -p 5432:5432 -d \
-e POSTGRES_PASSWORD=Pielly16 \
-e POSTGRES_USER=postgres \
-e POSTGRES_DB=adakadan \
-v pgdata:/var/lib/postgresql/data \
postgres

<!-- connect to localhost -->
psql -U postgres -h localhost -d adakadan

connect to container
docker exec -it b3cf3b0814c9 psql -U postgres adakadan