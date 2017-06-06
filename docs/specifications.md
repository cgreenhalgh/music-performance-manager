# Specifications

## Templates

c.f. muzicode experiences. Made available by server; one loaded by dashboard.

Object with properties:
- `expect` - array of `Expected` objects

`Expected` object, with properties:
- `id` - string, for cross-reference
- `requires` - array of IDs of pre-requisites (note, TestPoint MUST have on to identify process)
- `kind` - `Report`, `TestPoint` (others TBD)
- `testPoint` - test point ID (`TestPoint`)
- `like` - object to match against report (etc.) value
- `show` - boolean, default false, show value (currently only for TestPoint)
- `button` - value to set when requested (TestPoint only)
- `level` - `fatal`, `error`, `warning`, `info`, `debug`
- `name` - name/title
- `description`
- `maxCardinality` - number
- `feedback`:
  - `matched` - text (feedback)
  - `unmatcehd` - text (feedback)
  - `maxCardinality` - text

Optional variable replacement expressions, e.g. "{{ip}}". To be developed more in future...

## Reports

Send periodically by reporting agents to indicate the current state of (e.g.) a process or execution environment.

JSON-LD style object with properties:
- `@id` - entity (process/environment) unique ID, typically "urn:guid:..."
- `@type` - reporting entity type, currently `Process` or `Environment`
- `processType` (for process), currently `BrowserView`, `Node.js` or python
- `title`
- `info` - object with general / current information about entity
- `config` - object with key configuration
- `expire` - time to live of report in seconds
- `datetime` - datetime of report
- `testPoints` - object with test point objects (below), key is id

`testPoint`, i.e. something within the entity that can be monitored or controlled, an object with properties:
- `name` - human readable (optional)
- `read` - boolean
- `write` - boolean
- `monitor` - boolean (i.e. continuous read/event)
