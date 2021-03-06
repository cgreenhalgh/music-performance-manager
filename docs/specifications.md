# Specifications

## Templates

c.f. muzicode experiences. Made available by server; one loaded by dashboard.

Object with properties:
- `expect` - array of `Expected` objects
- `probes` - array of `Probe` objects

`Expected` object, with properties:
- `id` - string, for cross-reference
- `requires` - array of IDs of pre-requisites (note, TestPoint and File MUST have one to identify process)
- `kind` - `Report`, `TestPoint`, `File` (others TBD)
- `testPoint` - test point ID (`TestPoint`)
- `fileTag` - File tag (will match most recently created)
- `like` - object to match against report (etc.) value
- `show` - boolean, default false, show value (currently only for TestPoint)
- `button` - value to set when requested (TestPoint only)
- `post` - URL to post File to when requested (File only)
- `level` - `fatal`, `error`, `warning`, `info`, `debug`
- `name` - name/title
- `description`
- `maxCardinality` - number
- `feedback`:
  - `matched` - text (feedback)
  - `unmatched` - text (feedback)
  - `maxCardinality` - text
- `after` - array of IDs that it should 'be after', e.g. a Report like @type Process processType BrowserView is info.browserInfo.datetime; a TestPoint with a like value is when it was set to that value; a TestPoint without a like value is when it last changed.

`Probe` object, representing a Probe, with properties:
- `@id` - Probe unique ID
- `title`
- `probeType` (for probe), currently `HTTP`
- `config` - object with Probe-type specific configuration (see below)

Optional variable replacement expressions, e.g. "{{ip}}". To be developed more in future...

## Reports

Sent periodically by reporting agents to indicate the current state of (e.g.) a process or execution environment.

JSON-LD style object with properties:
- `@id` - entity (process/environment) unique ID, typically "urn:guid:..."
- `@type` - reporting entity type, currently `Process`, `Environment` or `Probe`
- `processType` (for process), currently `BrowserView`, `Node.js` or python
- `probeType` (for probe), currently `HTTP`
- `title`
- `info` - object with general / current information about entity
- `config` - object with key configuration
- `expire` - time to live of report in seconds
- `datetime` - datetime of report
- `testPoints` - object with test point objects (below), key is id
- `files` -  array of File objects (below) (process only??)

`testPoint`, i.e. something within the entity that can be monitored or controlled, an object with properties:
- `name` - human readable (optional)
- `read` - boolean
- `write` - boolean
- `monitor` - boolean (i.e. continuous read/event)

`File` object, i.e. a specifically important file such as a log file (proposed 2017-07-14)
- `path` - full path to file (within process's execution environment)
- `created` - datetime created
- `lastmodified` - datetime lastmodified
- `length` - length, bytes
(- `hash` - hash (md5?) of file bytes (preceeded by length))
- `useType`, `log` (`config`, `input`, `output` ...?)
- `tag` - process tag for file (cf parameter name); indicates use/purpose of file to application

## Probes

Probes are active agents created within the server to satisfy dashboard clients.

### HTTP Probe 

`HTTP` `Probe` periodically POSTs to a URL.

`config`:
- `url` - URL to post to
- `period` - time between probes in seconds
- `timeout` - maximum allowed response time

Presents `testPoint`(s):
- (name) `status` - HTTP status code or network error status

(to do: latency)

## Messages

### Socket.io

`mpm-report`, message is Report. Send by agent to server, and by server to dashboard.

`mpm-report.old`, message is Report. Sent by server to dashboard for historical reports.

`subscribe`, message is socket.io room to join ("mpm" or "mpm-monitor"). Sent by dashboard to server.

`readTestPoint`, `{ "iri": SOURCEIRI, "id": TESTPOINTID, "request":REQUESTID }`. Send by dashboard to monitor specified test point.

`readTestPointValue`, `{ "iri": SOURCEIRI, "id": TESTPOINTID, "value": VALUE, "request":REQUESTID }`. Send by agent to report test point value.

`monitorTestPoint`, `{ "iri": SOURCEIRI, "id": TESTPOINTID, "request":REQUESTID }`. Send by dashboard to monitor specified test point.

`monitorTestPointValue`, `{ "iri": SOURCEIRI, "id": TESTPOINTID, "value": VALUE }`. Send by agent to report test point value.

`setTestPoint`, `{ "iri": SOURCEIRI, "id": TESTPOINTID, "value": VALUE, "request":REQUESTID }`. Send by dashbaord to set test point value.

`postFile`, `{"iri":SOURCEIRI, "path":FILEPATH, "url":URL, "request":REQUESTID }`. Ask agent to HTTP POST specified file to the specified URL. E.g. to upload a log file. (proposed 2017-07-14)

`postFileResponse`,  `{"iri":SOURCEIRI, "path":FILEPATH, "request":REQUESTID, "status":HTTPSTATUSCODE, "length":FILELENGTH }`. Response to `postFile` request (proposed 2017-07-14)

`createProbe`, message is `Probe` object, sent by dashboard to server.

### HTTP

`POST` to `/api/1/mpm-report` with body `application/json`-enoded Report. Equivalent to socket.io `mpm-report`.
