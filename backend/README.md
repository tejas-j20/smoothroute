# SmoothRoute backend (Spring Boot)

Receives the bumps that phones detect, gives each one a severity, merges reports of the same
spot into one cluster, and serves the spots to the map.

```
phone  --POST /api/readings-->  IngestService  -->  ClusterService  -->  database
map    <--GET  /api/clusters--  ClusterQueryService  <------------------+
```

## Run it on your laptop
Needs Java 17 or newer. In IntelliJ: open the `backend` folder as a Maven project and run
`SmoothRouteApplication`. Or in a terminal (needs Maven): `mvn spring-boot:run`.

It starts on http://localhost:8080 with a file database in `./data` (nothing to install).

Try it (PowerShell):
```powershell
Invoke-RestMethod http://localhost:8080/api/health

$body = @{ lat=12.9716; lng=77.5946; speed=6.2; value=5.4; mode="plain"; accuracy=8;
           time=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); deviceId="test-1" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/readings -ContentType "application/json" -Body $body

Invoke-RestMethod http://localhost:8080/api/clusters
Invoke-RestMethod http://localhost:8080/api/stats
```

## Endpoints
| Method and path | What it does |
|---|---|
| `POST /api/readings` | One bump. Returns the severity and the spot it was merged into |
| `POST /api/readings/batch` | A list of bumps (max 500). Bad ones are skipped and counted as `rejected` |
| `GET /api/clusters` | All spots. Optional: `minLat, maxLat, minLng, maxLng, minReports, minSeverity` |
| `GET /api/clusters/{id}` | One spot with its latest reports |
| `GET /api/health` | Is the server alive |
| `GET /api/stats` | Totals for demos: readings, spots, confirmed spots, spots by severity |

Reading body: `lat, lng, speed (m/s), value (the detector's value), mode ("plain" or "normalised"),
accuracy (optional, metres), time (milliseconds since 1970), deviceId (optional anonymous id)`.

## Settings (src/main/resources/application.properties)
| Setting | Meaning |
|---|---|
| `smoothroute.cluster.radius-meters` | Reports closer than this are merged into one spot (default 15) |
| `smoothroute.cluster.confirm-reports` | Reports needed before a spot is "confirmed" (default 2) |
| `smoothroute.severity.plain.moderate / severe` | Severity limits for plain jolt, m/s^2 (4.5 / 7.5) |
| `smoothroute.severity.normalised.moderate / severe` | Limits for jolt per m/s (0.75 / 1.25) |
| `smoothroute.cors.allowed-origins` | Web addresses allowed to call the API |

Tune the severity limits from your own rides. Any setting can also be set with an environment
variable, for example `SMOOTHROUTE_CLUSTER_RADIUS_METERS=20`.

## Tests
`mvn test` runs the unit tests (distance, severity, clustering maths) and an API test that uses
an in-memory database.

## Put it online
Environment variables for a PostgreSQL database:
`SPRING_DATASOURCE_URL` (like `jdbc:postgresql://HOST:5432/DBNAME?sslmode=require`),
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.
The `Dockerfile` builds and runs the app; hosts such as Render use it directly (set the root
directory to `backend`). The server reads the `PORT` variable that the host provides.

Limits to know: report merging is locked inside one server instance, so run a single instance.
The tables are created automatically (`ddl-auto=update`), which is fine for a project but a real
product would use database migrations.
